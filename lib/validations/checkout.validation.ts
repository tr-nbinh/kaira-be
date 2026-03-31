import { z } from "zod";

const PAYMENT_METHODS = ["cod", "banking", "momo"] as const;

export const CheckoutSchema = z.object({
	checkoutId: z.uuid(),
	addressId: z.number().int().positive(),
	note: z.string().max(500).nullable().optional(),
	paymentMethod: z.enum(PAYMENT_METHODS),
	shippingFee: z.number().int().min(0).default(0),
	items: z
		.array(
			z.object({
				variantId: z.uuid(),
				quantity: z.number().int().positive(),
			}),
		)
		.min(1),
});

// Trích xuất Type từ Schema để dùng cho TypeScript
export type CheckoutInput = z.infer<typeof CheckoutSchema>;
