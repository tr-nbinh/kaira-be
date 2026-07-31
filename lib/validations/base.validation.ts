import z from "zod";

export const PagingSchema = z.object({
	page: z
		.string()
		.optional()
		.transform((val) => Math.max(1, parseInt(val || "1"))),
	limit: z
		.string()
		.optional()
		.transform((val) => Math.min(100, parseInt(val || "10"))),
});
export type PagingRequest = z.infer<typeof PagingSchema>;

export const UUIDSchema = z.string().trim().pipe(z.uuid("validation.string.uuid"));
