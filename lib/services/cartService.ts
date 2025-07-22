import { db } from "../db";

export async function getCartItems(lang: string = "en", userId: number) {
	try {
		const cartItems = await db.$queryRaw`
        WITH pt_en AS (
            SELECT * FROM product_translations WHERE language_code = ${lang}
        ),
        ct_en AS (
            SELECT * FROM color_translations WHERE language_code = ${lang}
        ),
        st_en AS (
            SELECT * FROM size_translations WHERE language_code = ${lang}
        )
        SELECT DISTINCT ON (ci.item_id)
            ci.item_id AS id,
            pt.name AS name,
            ct.name AS color,
            co.hex_code AS "hexColor",
            pv.quantity_in_stock AS "quantityInStock",
            ci.quantity,
            st.name AS size,
            pv.price,
            vi.image_url as "imageUrl",
            p.product_id as "productId",
            pt.slug,
            ci.variant_id as "variantId",
            CASE 
            WHEN pv.discount_percentage IS NOT NULL THEN pv.price * (1 - pv.discount_percentage / 100.0)
            ELSE pv.price
            END AS "finalPrice"
        FROM carts c
        JOIN cart_items ci ON ci.cart_id = c.cart_id
        JOIN product_variants pv ON pv.variant_id = ci.variant_id
        JOIN products p ON p.product_id = pv.product_id
        JOIN pt_en pt ON pt.product_id = p.product_id
        JOIN colors co ON co.color_id = pv.color_id
        JOIN ct_en ct ON ct.color_id = co.color_id
        LEFT JOIN st_en st ON st.size_id = pv.size_id
        JOIN variant_images vi ON vi.variant_id = pv.variant_id
        WHERE c.user_id = ${userId} AND vi.is_main_image = true
        `;

		return cartItems;
	} catch (err) {
		console.error("Database error in getCartItems:", err);
		throw new Error("Failed to fetch cart items from database");
	}
}
