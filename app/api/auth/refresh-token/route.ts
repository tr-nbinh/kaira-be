import { response } from "@/lib/helpers/api-helpers";
import { getApiI18nContext } from "@/lib/helpers/api-i18n-context";
import { authService } from "@/lib/services/auth.service";
import { sendSuccess } from "@/lib/utils/api-response";
import { handleApiError } from "@/lib/utils/handleError";
import { cookies } from "next/headers";

export async function POST(req: Request) {
	const cookieStore = await cookies();
	try {
		const { t } = await getApiI18nContext(req);
		const refreshTokenCookie = cookieStore.get("refresh_token");
		if (!refreshTokenCookie || !refreshTokenCookie.value) {
			return response({ message: t("auth.refresh.token_not_found") }, 401);
		}

		const data = await authService.refreshToken(refreshTokenCookie.value, t);
		return sendSuccess(data, t("auth.refresh.success"));
	} catch (error) {
		cookieStore.delete("refresh_token");
		return handleApiError(error);
	}
}
