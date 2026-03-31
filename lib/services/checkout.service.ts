import { db } from "../db";
import { ApiError } from "../utils/api-error";
import { CheckoutInput } from "../validations/checkout.validation";

export const checkoutService = {
	async checkout(
		{ checkoutId, addressId, paymentMethod, shippingFee, note, items }: CheckoutInput,
		userId: number,
		t: Function,
	) {
		const existingOrder = await db.order.findUnique({
			where: { checkout_id: checkoutId },
		});
		if (existingOrder) {
			return { existingOrder };
		}

		const result = await db.$transaction(async (tx) => {
			const cart = await tx.cart.findFirst({
				where: { userId },
			});

			if (!cart) {
				throw new ApiError(t("order.cart_not_found"), 404);
			}
			const address = await tx.address.findFirst({
				where: { id: addressId, userId },
			});

			if (!address) {
				throw new ApiError(t("order.address_notfound"), 404);
			}

			let total = 0;
			const variantMap = new Map();
			for (const item of items) {
				const variant = await tx.product_variants.findUnique({
					where: { id: item.variantId },
				});
				if (!variant) {
					throw new ApiError(t("order.variant_notfound"), 404);
				}
				if (variant.stock < item.quantity) {
					throw new ApiError(t("order.out_of_stock"), 409);
				}

				variantMap.set(item.variantId, variant);
				total += Number(variant.price) * item.quantity;
			}
			const order = await tx.order.create({
				data: {
					userId,
					addressId,
					totalAmount: total,
					status: "pending",
					checkout_id: checkoutId,
					paymentMethod,
					note,
					shippingFee,
				},
			});

			for (const item of items) {
				const variant = variantMap.get(item.variantId);

				await tx.orderItem.create({
					data: {
						orderId: order.id,
						variantId: item.variantId,
						quantity: item.quantity,
						price: variant.price,
					},
				});

				const updated = await tx.product_variants.updateMany({
					where: {
						id: item.variantId,
						stock: {
							gte: item.quantity,
						},
					},
					data: {
						stock: {
							decrement: item.quantity,
						},
					},
				});

				if (updated.count === 0) {
					throw new ApiError(t("order.out_of_stock"), 409);
				}
			}
			await tx.cartItem.deleteMany({
				where: {
					cartId: cart.id,
				},
			});
			return order;
		});
		return result;
	},
};
