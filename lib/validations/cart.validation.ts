import { z } from "zod";
import { UUIDSchema } from "./base.validation";

export const variantIdSchema = z.string().trim().pipe(z.uuid("validation.string.uuid"));

export const quantitySchema = z.coerce
	.number("validation.number.is_number")
	.int("validation.number.integer")
	.min(1, "validation.number.min");

export const updateQuantitySchema = z.object({
	cartItemId: UUIDSchema,
	quantity: quantitySchema,
});

export const deleteCartItemSchema = z.object({
	cartItemId: UUIDSchema,
});

export const addToCartSchema = z.object({
	variantId: variantIdSchema,
	quantity: quantitySchema,
});
