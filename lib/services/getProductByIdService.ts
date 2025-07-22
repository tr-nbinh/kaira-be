import pool from "../db";
import type { ProductResponse } from "@/models/product.model";

export async function getProductById(id: number): Promise<ProductResponse | null> {
  const query = `
    SELECT p.product_id AS id,
           pt.name,
           pt.description,
           p.is_favorite AS "isFavorite",
           pv.price,
           vi.image_url AS "imageUrl",
           pt.slug
    FROM public.products p
    LEFT JOIN public.product_translations pt ON p.product_id = pt.product_id
    LEFT JOIN public.product_variants pv ON p.product_id = pv.product_id
    LEFT JOIN public.variant_images vi ON pv.variant_id = vi.variant_id
    WHERE p.product_id = $1
    LIMIT 1;
  `;
  const result = await pool.query(query, [id]);
  if (result.rows.length === 0) return null;
  return result.rows[0];
}
