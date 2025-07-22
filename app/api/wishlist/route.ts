import { db } from "@/lib/db";
import { response } from "@/lib/helpers/api-helpers";
import { getApiI18nContext } from "@/lib/helpers/api-i18n-context";
import { getWishlistItems } from "@/lib/services/wishlistService";
import { getAuthenticatedUserId } from "@/lib/utils/auth-util";
import { handleApiError } from "@/lib/utils/handleError";
import { AuthenticatedRequest } from "@/middleware-handler/auth";
import { NextRequest } from "next/server";

// Get items in wishlist
export async function GET(req: NextRequest) {
	try {
		const { t, locale } = await getApiI18nContext(req);

		const userId = getAuthenticatedUserId(req);
		if (!userId) {
			return response({ message: t("auth.unauthorized") }, 401);
		}

		const result = await getWishlistItems(locale, userId);
		return Response.json(result, { status: 200 });
	} catch (error) {
		handleApiError(error);
	}
}

// Add item to wishlist
export async function POST(req: NextRequest) {
	try {
		const { t } = await getApiI18nContext(req);

		const userId = getAuthenticatedUserId(req);
		if (!userId) {
			return response({ message: t("auth.unauthorized") }, 401);
		}

		const { variantId } = await req.json();
		if (!variantId) {
			return response({ message: t("wishlist.required") }, 400);
		}
		const result = await db.$transaction(async (tx) => {
			const variant = await tx.productVariant.findFirst({
				where: { id: variantId },
			});
			if (!variant) {
				return { error: t("wishlist.item_not_found"), status: 404 };
			}

			let wishlist = await tx.wishlist.findFirst({
				where: { userId: userId },
			});
			if (!wishlist) {
				wishlist = await tx.wishlist.create({
					data: { userId: userId },
				});
			}

			const existingItem = await tx.wishlistItem.findFirst({
				where: { wishlistId: wishlist.id, variantId: variantId },
			});
			if (existingItem) {
				return { error: t("wishlist.item_existed"), status: 200 };
			}   
			await tx.wishlistItem.create({
				data: { wishlistId: wishlist.id, variantId: variantId },
			});

			const itemCount = await tx.wishlistItem.count({
				where: { wishlistId: wishlist.id },
			});
            return { data: itemCount };
		});
        if (result.error) {
            return response({ message: result.error }, result.status);
        }

        return response({ message: t("wishlist.add_success"), data: result.data });
	} catch (error: any) {
		console.error("Lỗi khi thêm sản phẩm vào mục yêu thích:", error);
		return Response.json(
			{ message: error.message || "Không thể thêm sản phẩm vào mục yêu thích" },
			{ status: 500 }
		);
	}
}
