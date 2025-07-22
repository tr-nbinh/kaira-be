import { db } from "@/lib/db";
import { response } from "@/lib/helpers/api-helpers";
import { getApiI18nContext } from "@/lib/helpers/api-i18n-context";
import { getAuthenticatedUserId } from "@/lib/utils/auth-util";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
	try {
		const { t } = await getApiI18nContext(req);

		const userId = getAuthenticatedUserId(req);
		if (!userId) {
			return response({ message: t("auth.unauthorized") }, 401);
		}

		const cart = await db.cart.findFirst({
			where: { userId: userId },
		});
		if (!cart) {
			return response({ message: t("cart.cart_not_found"), data: 0 }, 200);
		}

		// Đếm số item khác nhau trong giỏ hàng
		const itemCount = await db.cartItem.count({
			where: { cartId: cart.id },
		});

		return response({ message: "success", data: itemCount });
	} catch (error: any) {
		console.error("Lỗi khi đếm itemCount:", error);
		return Response.json({ success: false, message: "Lỗi server" }, { status: 500 });
	}
}
