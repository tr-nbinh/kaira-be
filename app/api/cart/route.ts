import { getApiI18nContext } from "@/lib/helpers/api-i18n-context";
import { cartService } from "@/lib/services/cart.service";
import { ApiError } from "@/lib/utils/api-error";
import { sendSuccess } from "@/lib/utils/api-response";
import { getAuthenticatedUserId } from "@/lib/utils/auth-util";
import { handleApiError } from "@/lib/utils/handleError";
import { PagingSchema } from "@/lib/validations/base.validation";
import { addToCartSchema } from "@/lib/validations/cart.validation";
import { NextRequest } from "next/server";

// Get items in cart
export async function GET(req: NextRequest) {
	try {
		const { t, locale } = await getApiI18nContext(req);
		const userId = getAuthenticatedUserId(req);
		if (!userId) {
			throw new ApiError(t("auth.unauthorized"), 401);
		}

		const { searchParams } = new URL(req.url);
		const rawParams = Object.fromEntries(searchParams.entries());
		const validatedParams = PagingSchema.parse(rawParams);
		const data = await cartService.getCartItems(validatedParams, userId, locale);
		return sendSuccess(data, "Get cart items successfully");
	} catch (error) {
		return handleApiError(error);
	}
}

// Add item to cart
export async function POST(req: NextRequest) {
	try {
		const { t } = await getApiI18nContext(req);

		const userId = getAuthenticatedUserId(req);
		if (!userId) {
			throw new ApiError(t("auth.unauthorized"), 401);
		}
		const { variantId, quantity } = await req.json();
		const validatedData = addToCartSchema.parse({ variantId, quantity });

		const data = await cartService.addToCart(userId, validatedData.variantId, validatedData.quantity, t);
		return sendSuccess(data, t("cart.add_success"));
	} catch (error) {
		return handleApiError(error);
	}
}
