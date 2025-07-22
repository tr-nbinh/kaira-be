import { clearRefreshTokenCookie } from "@/lib/auth";
import { db } from "@/lib/db";
import { response } from "@/lib/helpers/api-helpers";
import { getApiI18nContext } from "@/lib/helpers/api-i18n-context";
import { getAuthenticatedUserId } from "@/lib/utils/auth-util";
import { handleApiError } from "@/lib/utils/handleError";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
	try {
		const { t } = await getApiI18nContext(request);

		const userId = getAuthenticatedUserId(request);
		if (!userId) {
			await clearRefreshTokenCookie();
			return response({ message: t("auth.logout.success") }, 200);    
		}

		const cookieStore = await cookies();
		const refreshTokenCookie = cookieStore.get("refreshToken");
		if (!refreshTokenCookie || !refreshTokenCookie.value) {
			await clearRefreshTokenCookie();
			return response({ message: t("auth.logout.success") }, 200);
		}

		const userToLogout = await db.user.findUnique({
			where: { id: userId },
			select: { id: true },
		});
		if (!userToLogout) {
			await clearRefreshTokenCookie();
			return response({ message: t("auth.logout.success") }, 200);
		}

		await db.user.update({
			where: { id: userToLogout.id },
			data: {
				refreshTokenHash: null,
				refreshTokenExpiresAt: null,
			},
		});
		await clearRefreshTokenCookie();

		return response({ message: t("auth.logout.success") }, 200);
	} catch (err) {
		return handleApiError(err);
	}
}
