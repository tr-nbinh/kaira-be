import z from "zod";

const idSchema = z.string().trim().pipe(z.uuid("validation.string.uuid"));

export const productDetailSchema = z.object({
	id: idSchema,
});

const commaSeparatedNumericArray = z
	.string()
	.optional()
	.transform((val) => {
		return val ? val.split(",").filter((n) => idSchema) : [];
	});

export const ProductFilterSchema = z.object({
	searchTerm: z.string().optional().default(""),
	page: z
		.string()
		.optional()
		.transform((val) => Math.max(1, parseInt(val || "1"))),
	limit: z
		.string()
		.optional()
		.transform((val) => Math.min(100, parseInt(val || "10"))),

	// Các bộ lọc mảng (Colors, Sizes, v.v.)
	colors: commaSeparatedNumericArray,
	sizes: commaSeparatedNumericArray,
	brands: commaSeparatedNumericArray,
	categories: commaSeparatedNumericArray,
	minPrice: z.coerce.number().min(0, "Giá thấp nhất không được âm").optional(),
	maxPrice: z.coerce.number().positive("Giá cao nhất phải lớn hơn 0").optional(),
});

export type ProductFilter = z.infer<typeof ProductFilterSchema>;
