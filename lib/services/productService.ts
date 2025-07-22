import { PaginatedResponse } from "@/models/paginatedResponse.model";
import pool from "../db";
import { GetProductsOptions, ProductResponse } from "@/models/product.model";

function buildProductQuery(options: GetProductsOptions) {
	const {
		lang = "en",
		categoryIds = [],
		colorIds = [],
		sizeIds = [],
		brandIds = [],
		bestSeller,
		bestReviewed,
		isNewArrival,
		priceRanges = [],
		page = 1,
		limit = 10,
	} = options;

	const selectColumns = `
			pfv.id,
			pfv.name,
			pfv.description,
			pfv.slug,
			pfv.variants,
			pfv.colors,
            pfv.sizes,
            pfv.categories,
            pfv.best_reviewed as "bestReviewed",
            pfv.best_seller as "bestSeller",
            pfv.is_new_arrival as "newArrival",
            pfv.brand_id`;

	let baseQuery = `
		FROM product_full_view pfv`;

	const values: any[] = [];
	const conditions: string[] = [];
	let paramIndex = 1;

	// conditions.push(`pt.language_code = $${paramIndex++}`);
	// values.push(lang);

	if (typeof bestReviewed === "boolean" && bestReviewed) {
		conditions.push(`pfv.best_reviewed = $${paramIndex++}`);
		values.push(bestReviewed);
	}

	if (typeof bestSeller === "boolean" && bestSeller) {
		conditions.push(`pfv.best_seller = $${paramIndex++}`);
		values.push(bestSeller);
	}

	if (typeof isNewArrival === "boolean" && isNewArrival) {
		conditions.push(`pfv.is_new_arrival = $${paramIndex++}`);
		values.push(isNewArrival);
	}

	if (categoryIds.length) {
		// baseQuery += `
		// LEFT JOIN product_category pc ON pc.product_id = p.product_id`;
		conditions.push(
			`EXISTS (SELECT 1 FROM jsonb_array_elements(categories) as c WHERE (c->>'id')::int = ANY($${paramIndex++}))`
		);
		values.push(categoryIds);
	}

	if (colorIds.length) {
		conditions.push(
			`EXISTS (SELECT 1 FROM jsonb_array_elements(colors) as c WHERE (c->>'id')::int = ANY($${paramIndex++}))`
		);
		values.push(colorIds);
	}

	if (sizeIds.length) {
		conditions.push(
			`EXISTS (SELECT 1 FROM jsonb_array_elements(sizes) as s WHERE (s->>'id')::int = ANY($${paramIndex++}))`
		);
		values.push(sizeIds);
	}

	if (brandIds.length) {
		conditions.push(`pfv.brand_id = ANY($${paramIndex++})`);
		values.push(brandIds);
	}

	// Price filter (multiple ranges)
	const priceRangeConditions: string[] = [];
    const priceQuery = `EXISTS (SELECT 1 FROM jsonb_array_elements(variants) AS v WHERE`;
	priceRanges.length &&
		priceRanges.forEach((range) => {
			if (typeof range.min === "number" && typeof range.max === "number") {
				priceRangeConditions.push(
					`(v->>'price')::numeric >= $${paramIndex++} AND (v->>'price')::numeric <= $${paramIndex++}`
				);
				values.push(range.min, range.max);
			} else if (typeof range.min === "number") {
				priceRangeConditions.push(`(v->>'price')::numeric >= $${paramIndex++}`);
				values.push(range.min);
			} else if (typeof range.max === "number") {
				priceRangeConditions.push(`(v->>'price')::numeric <= $${paramIndex++}`);
				values.push(range.max);
			}
		});

	if (priceRangeConditions.length) {
		conditions.push(`${priceQuery} ${priceRangeConditions.join(" OR ")})`);
	}

	let whereClause = "";
	if (conditions.length) {
		whereClause = `WHERE (pfv.id = 16 OR pfv.id = 17) AND ${conditions.join(" AND ")}`;
	} else {
		whereClause = `WHERE (pfv.id = 16 OR pfv.id = 17)`;
	}

	const orderByClause = `ORDER BY pfv.id ASC`;
	// Pagination
	const offset = (page - 1) * limit;
	const limitOffsetClause = `LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
	values.push(limit, offset);

	const finalQueryText = `
		SELECT
        ${selectColumns}
		${baseQuery}
		${whereClause} 
		${orderByClause}
		${limitOffsetClause}
	`;

	const countQueryText = `
		SELECT COUNT(pfv.id)
		${baseQuery}
		${whereClause};
	`;
	const countValues = values.slice(0, values.length - 2);

	return { query: finalQueryText, values, countQuery: countQueryText, countValues };
}

export async function getProducts(options: GetProductsOptions = {}): Promise<PaginatedResponse<ProductResponse>> {
	const { query: dataQuery, values: dataValues, countQuery, countValues } = buildProductQuery(options);

	try {
		const countResult = await pool.query(countQuery, countValues);
		const totalCount = parseInt(countResult.rows[0].count, 10);

		const productsResult = await pool.query(dataQuery, dataValues);

		return {
			data: productsResult.rows,
			totalCount,
			limit: options.limit || 10,
			page: options.page || 1,
			totalPages: Math.ceil(totalCount / (options.limit || 10)),
		};
	} catch (err) {
		console.error("Database error in getProducts:", err);
		throw new Error("Failed to fetch products from database");
	}
}

// Các hàm khác như getProductById, createProduct, updateProduct, deleteProduct (như đã mô tả trước)
// ...
export async function getProductById(lang: string, id: number): Promise<ProductResponse | null> {
	try {
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
        WHERE pt.language_code = $1 AND p.product_id = $2
        LIMIT 1;`;

		const result = await pool.query(query, [lang, id]);
		if (result.rows.length === 0) return null;
		return result.rows[0];
	} catch (err) {
		console.error("Database error in getProductById:", err);
		throw new Error("Failed to fetch product by id from database");
	}
}
