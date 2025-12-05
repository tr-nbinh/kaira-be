import pool, { db } from "@/lib/db";
import { response } from "@/lib/helpers/api-helpers";
import { getApiI18nContext } from "@/lib/helpers/api-i18n-context";
import { getAuthenticatedUserId } from "@/lib/utils/auth-util";
import { handleApiError } from "@/lib/utils/handleError";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { t, locale } = await getApiI18nContext(req);
		const userId = getAuthenticatedUserId(req);

		const { id } = await params;
		const newId = parseInt(id, 10);
		if (isNaN(newId)) {
			return response({ message: t("product.item_not_found") }, 400);
		}

		const result = await pool.query("SELECT * FROM get_product_details($1, $2)", [newId, locale]);
		if (!result) {
			return response({ message: t("product.item_not_found") }, 404);
		}
		let productWithFavorite = result.rows[0];
		if (userId) {
			console.log("run");
			const items = await db.wishlistItem.findMany({
				where: { wishlist: { userId } },
				select: { variantId: true },
			});

			const favoriteVariants = new Set(items.map((i) => i.variantId));
			if (favoriteVariants.size) {
				productWithFavorite.variants = productWithFavorite.variants.map((variant: any) => ({
					...variant,
					isFavorite: favoriteVariants.has(variant.id),
				}));
			}
		}

		return Response.json(productWithFavorite, { status: 200 });
	} catch (err) {
		return handleApiError(err);
	}
}
