import { getApiI18nContext } from "@/lib/helpers/api-i18n-context";
import { cartService } from "@/lib/services/cart.service";
import { ApiError } from "@/lib/utils/api-error";
import { sendSuccess } from "@/lib/utils/api-response";
import { getAuthenticatedUserId } from "@/lib/utils/auth-util";
import { handleApiError } from "@/lib/utils/handleError";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
	try {
		const { t } = await getApiI18nContext(req);
		const userId = getAuthenticatedUserId(req);
		if (!userId) {
			throw new ApiError(t("auth.unauthorized"), 401);
		}

		const data = await cartService.getCartCount(userId);
		return sendSuccess(data, "Get cart count successfully");
	} catch (error) {
		return handleApiError(error);
	}
}
