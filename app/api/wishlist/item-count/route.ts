import { getApiI18nContext } from "@/lib/helpers/api-i18n-context";
import { wishlistService } from "@/lib/services/wishlist.service";
import { ApiError } from "@/lib/utils/api-error";
import { sendSuccess } from "@/lib/utils/api-response";
import { getAuthenticatedUserId } from "@/lib/utils/auth-util";
import { handleApiError } from "@/lib/utils/handleError";
import { NextRequest } from "next/server";

// Get user's items in wishlists
export async function GET(req: NextRequest) {
	try {
		const { t } = await getApiI18nContext(req);
		const userId = getAuthenticatedUserId(req);
		if (!userId) {
			throw new ApiError(t("auth.unauthorized"), 401);
		}

		const data = await wishlistService.getWishlistCount(userId);
		return sendSuccess(data, "Get wishlist count successfully");
	} catch (error) {
		return handleApiError(error);
	}
}
