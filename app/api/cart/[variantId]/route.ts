import { db } from "@/lib/db";
import { response } from "@/lib/helpers/api-helpers";
import { getApiI18nContext } from "@/lib/helpers/api-i18n-context";
import { getAuthenticatedUserId } from "@/lib/utils/auth-util";
import { handleApiError } from "@/lib/utils/handleError";
import { NextRequest } from "next/server";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ variantId: string }> }) {
	try {
		const { t } = await getApiI18nContext(req);

		const userId = getAuthenticatedUserId(req);
		if (!userId) {
			return response({ message: t("auth.unauthorized") }, 401);
		}
        const { variantId } = await params
		const newVariantId = parseInt(variantId);
		if (!newVariantId) {
			return response({ message: t("cart.item_not_found") }, 400);
		}

		const cart = await db.cart.findUnique({
			where: { userId: userId },
		});
		if (!cart) {
			return response({ message: t("cart.cart_not_found") }, 404);
		}

		await db.cartItem.delete({
			where: { cartId_variantId: { cartId: cart.id, variantId: newVariantId } },
		});

		const totalItems = await db.cartItem.count({
			where: { cartId: cart.id },
		});

		return response({ message: t("cart.delete_success"), data: totalItems });
	} catch (err) {
		handleApiError(err);
	}
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ variantId: string }> }) {
	try {
		const { t } = await getApiI18nContext(req);

		const userId = getAuthenticatedUserId(req);
		if (!userId) {
			return response({ message: t("auth.unauthorized") }, 401);
		}

		const { variantId } = await params;
		const newVariantId = parseInt(variantId);
		if (!newVariantId) {
			return response({ message: t("cart.item_not_found") }, 400);
		}

		const { quantity } = await req.json();
		if (!quantity || typeof quantity !== "number" || quantity < 1) {
			return response({ message: t("cart.amount_invalid") }, 400);
		}

		const cart = await db.cart.findFirst({
			where: { userId: userId },
		});
		if (!cart) {
			return response({ message: t("cart.cart_not_found") }, 404);
		}

		await db.cartItem.update({
			where: { cartId_variantId: { cartId: cart.id, variantId: newVariantId } },
			data: { quantity },
		});

		return response({ message: t("cart.update_success") });
	} catch (err) {
		handleApiError(err);
	}
}
