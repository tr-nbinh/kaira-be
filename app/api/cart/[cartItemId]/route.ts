import { getApiI18nContext } from "@/lib/helpers/api-i18n-context";
import { cartService } from "@/lib/services/cart.service";
import { ApiError } from "@/lib/utils/api-error";
import { sendSuccess } from "@/lib/utils/api-response";
import { getAuthenticatedUserId } from "@/lib/utils/auth-util";
import { handleApiError } from "@/lib/utils/handleError";
import { deleteCartItemSchema, updateQuantitySchema } from "@/lib/validations/cart.validation";
import { NextRequest } from "next/server";

interface RouteParams {
	cartItemId: string;
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<RouteParams> }) {
	try {
		const { t } = await getApiI18nContext(req);

		const userId = getAuthenticatedUserId(req);
		if (!userId) {
			throw new ApiError(t("auth.unauthorized"), 401);
		}
		const { cartItemId } = await params;
		const validatedVariantId = deleteCartItemSchema.parse({ cartItemId });

		const data = await cartService.deleteItem(userId, validatedVariantId.cartItemId);
		return sendSuccess(data, t("cart.delete_success"));
	} catch (err) {
		return handleApiError(err);
	}
}

// Update quantity
export async function PATCH(req: NextRequest, { params }: { params: Promise<RouteParams> }) {
	try {
		const { t } = await getApiI18nContext(req);
		const userId = getAuthenticatedUserId(req);
		if (!userId) {
			throw new ApiError(t("auth.unauthorized"), 401);
		}

		const { cartItemId } = await params;
		const { quantity } = await req.json();
		const validatedData = updateQuantitySchema.parse({ cartItemId, quantity });

		const data = await cartService.updateQuantity(userId, validatedData.cartItemId, validatedData.quantity);
		return sendSuccess(data, t("cart.update_success"));
	} catch (err) {
		return handleApiError(err);
	}
}
