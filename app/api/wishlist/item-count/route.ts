import { db } from "@/lib/db";
import { response } from "@/lib/helpers/api-helpers";
import { getApiI18nContext } from "@/lib/helpers/api-i18n-context";
import { getAuthenticatedUserId } from "@/lib/utils/auth-util";
import { NextRequest } from "next/server";

// Get total items in cart
export async function GET(req: NextRequest) {
	try {
		const { t } = await getApiI18nContext(req);

		const userId = getAuthenticatedUserId(req);
		if (!userId) {
			return response({ message: t("auth.unauthorized") }, 401);
		}

		const wishlist = await db.wishlist.findFirst({
			where: { userId: userId },
		});
		if (!wishlist) {
			return response({ message: t("wishlist.wishlist_not_found"), data: 0 }, 200);
		}

		const wishlistItemCount = await db.wishlistItem.count({
			where: { wishlistId: wishlist.id },
		});

		return response({ message: "success", data: wishlistItemCount });
	} catch (error: any) {
		console.error("Lỗi khi đếm itemCount:", error);
		return Response.json({ success: false, message: "Lỗi server" }, { status: 500 });
	}
}
