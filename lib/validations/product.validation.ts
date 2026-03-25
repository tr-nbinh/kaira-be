import z from "zod";

const idSchema = z.string().trim().pipe(z.uuid("validation.string.uuid"));

export const productDetailSchema = z.object({
	id: idSchema,
});
