import { response } from "@/lib/helpers/api-helpers";
import { getApiI18nContext } from "@/lib/helpers/api-i18n-context";
import { authService } from "@/lib/services/auth.service";
import { sendSuccess } from "@/lib/utils/api-response";
import { handleApiError } from "@/lib/utils/handleError";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
	try {
		const { t } = await getApiI18nContext(request);
		const token = (await cookies()).get("refresh_token")?.value;
		if (!token) {
			return response({ message: t("auth.refresh.token_not_found") }, 401);
		}
		const data = await authService.logout(token);

		return sendSuccess(data, t("auth.logout.success"));
	} catch (err) {
		return handleApiError(err);
	}
}
