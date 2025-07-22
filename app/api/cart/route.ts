import { db } from "@/lib/db";
import { response } from "@/lib/helpers/api-helpers";
import { getApiI18nContext } from "@/lib/helpers/api-i18n-context";
import { getCartItems } from "@/lib/services/cartService";
import { getAuthenticatedUserId } from "@/lib/utils/auth-util";
import { handleApiError } from "@/lib/utils/handleError";
import { NextRequest } from "next/server";

// Get items in cart
export async function GET(req: NextRequest) {
	try {
		const { t, locale } = await getApiI18nContext(req);

		const userId = getAuthenticatedUserId(req);
		if (!userId) {
			return response({ message: t("auth.unauthorized") }, 401);
		}

		const result = await getCartItems(locale, userId);

		return Response.json(result, { status: 200 });
	} catch (error) {
		handleApiError(error);
	}
}

// Add item to cart
export async function POST(req: NextRequest) {
	try {
		const { t } = await getApiI18nContext(req);

		const userId = getAuthenticatedUserId(req);
		if (!userId) {
			return response({ message: t("auth.unauthorized") }, 401);
		}

		const { variantId, quantity } = await req.json();
		if (!variantId || !quantity || quantity <= 0) {
			return response({ message: t("cart.required") }, 400);
		}

		const result = await db.$transaction(async (tx) => {
			const variant = await tx.productVariant.findFirst({
				where: { id: variantId },
			});
			if (!variant) {
				return { error: t("cart.item_not_found"), status: 404 };
			}
			if (quantity > variant.quantityInStock) {
				return { error: t("cart.amount_invalid"), status: 400 };
			}

			let cart = await tx.cart.findFirst({
				where: { userId: userId, status: "active" },
			});
			if (!cart) {
				cart = await tx.cart.create({
					data: { userId: userId },
				});
			}

			const existingItem = await tx.cartItem.findFirst({
				where: { cartId: cart.id, variantId: variantId },
			});
			if (existingItem) {
				if (quantity + existingItem.quantity > variant.quantityInStock) {
					return { error: t("cart.amount_invalid"), status: 400 };
				}
				await tx.cartItem.update({
					where: { id: existingItem.id },
					data: { quantity: existingItem.quantity + quantity },
				});
			} else {
				await tx.cartItem.create({
					data: { cartId: cart.id, variantId: variantId, quantity: quantity },
				});
			}

			const itemCount = await tx.cartItem.count({
				where: { cartId: cart.id },
			});

			return { data: itemCount };
		});
		if (result.error) {
			return response({ message: result.error }, result.status);
		}

		return response({ message: t("cart.add_success"), data: result.data });
	} catch (error: any) {
		console.error("Lỗi khi thêm sản phẩm vào giỏ hàng:", error);
		return Response.json({ message: error.message || "Không thể thêm sản phẩm vào giỏ hàng" }, { status: 500 });
	}
}
