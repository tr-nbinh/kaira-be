import { getApiI18nContext } from "@/lib/helpers/api-i18n-context";
import { wishlistService } from "@/lib/services/wishlist.service";
import { ApiError } from "@/lib/utils/api-error";
import { sendSuccess } from "@/lib/utils/api-response";
import { getAuthenticatedUserId } from "@/lib/utils/auth-util";
import { handleApiError } from "@/lib/utils/handleError";
import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";

// Get items in wishlist
export async function GET(req: NextRequest) {
	try {
		const { t, locale } = await getApiI18nContext(req);
		const userId = getAuthenticatedUserId(req);
		if (!userId) {
			throw new ApiError(t("auth.unauthorized"), 401);
		}
		const data = await wishlistService.getWishlistItems(userId, locale);
		return sendSuccess(data, "Get wishlish items successfully");
	} catch (error) {
		return handleApiError(error);
	}
}

// Add item to wishlist
export async function POST(req: NextRequest) {
	const { t } = await getApiI18nContext(req);
	try {
		const userId = getAuthenticatedUserId(req);
		if (!userId) {
			throw new ApiError(t("auth.unauthorized"), 401);
		}
		const { variantId } = await req.json();
		if (!variantId) {
			throw new ApiError("VariantId is invalid", 402);
		}
		const data = await wishlistService.addToWishlist(variantId, userId);
		const message = data.isWishlisted ? "wishlist.success.added" : "wishlist.success.removed";
		return sendSuccess(data, t(message));
	} catch (error: any) {
		let newError;
		if (error instanceof Prisma.PrismaClientKnownRequestError) {
			if (error.code === "P2003") {
				newError = { message: t("wishlist.error.not_found"), status: 400, code: error.code };
			}
		}
		return handleApiError(newError || error);
	}
}
