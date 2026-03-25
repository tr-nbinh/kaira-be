import { z } from "zod";

export const variantIdSchema = z.string().trim().pipe(z.uuid("validation.string.uuid"));

export const quantitySchema = z.coerce
	.number("validation.number.is_number")
	.int("validation.number.integer")
	.min(1, "validation.number.min");

export const updateQuantitySchema = z.object({
	variantId: variantIdSchema,
	quantity: quantitySchema,
});

export const deleteVariantSchema = z.object({
	variantId: variantIdSchema,
});

export const addToCartSchema = z.object({
	variantId: variantIdSchema,
	quantity: quantitySchema,
});
