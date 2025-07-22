import { db } from "@/lib/db";
import { response } from "@/lib/helpers/api-helpers";
import { getApiI18nContext } from "@/lib/helpers/api-i18n-context";
import { getAuthenticatedUserId } from "@/lib/utils/auth-util";
import { handleApiError } from "@/lib/utils/handleError";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
	try {
		const { t } = await getApiI18nContext(req);

		const userId = getAuthenticatedUserId(req);
		if (!userId) {
			return response({ message: t("auth.unauthorized") }, 401);
		}

		const { orderItems, ...data } = await req.json();
		if (!orderItems || !orderItems.length) {
			return response({ message: t("order.invalid") }, 400);
		}

		const subTotal = orderItems.reduce((acc: any, curr: any) => acc + curr.finalPrice * curr.quantity, 0);

		const result = await db.$transaction(async (tx) => {
			const newOrder = await tx.order.create({
				data: {
					addressId: data.addressId,
					shippingFee: 20,
					totalAmount: subTotal + 20,
					paymentMethod: data.paymentMethod,
					note: data.note,
					userId: userId,
				},
			});
			if (!newOrder) {
				return { error: t("order.failed"), status: 400 };
			}

			const orderItemsData = await orderItems.map((item: any) => ({
				orderId: newOrder.id,
				variantId: item.variantId,
				quantity: item.quantity,
				price: item.finalPrice,
			}));
			await tx.orderItem.createMany({
				data: orderItemsData,
			});

			const cart = await db.cart.findUnique({
				where: { userId: userId },
			});
			if (!cart) {
				return { error: t("cart.cart_not_found"), status: 400 };
			}

			const updateStock = Promise.all(
				orderItems.map((item: any) => {
					return tx.productVariant.update({
						where: { id: item.variantId },
						data: { quantityInStock: { decrement: item.quantity } },
					});
				})
			);
			const deleteFromCart = tx.cartItem.deleteMany({
				where: {
					cartId: cart.id,
					variantId: { in: orderItems.map((i: any) => i.variantId) },
				},
			});
			await Promise.all([updateStock, deleteFromCart]);
		});

		if (result?.error) {
			return response({ message: t("order.failed") }, result.status);
		}

		return response({ message: t("order.success") });
	} catch (error) {
		return handleApiError(error);
	}
}
