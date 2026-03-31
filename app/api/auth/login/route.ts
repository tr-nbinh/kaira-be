import { getApiI18nContext } from "@/lib/helpers/api-i18n-context";
import { authService } from "@/lib/services/auth.service";
import { sendSuccess } from "@/lib/utils/api-response";
import { handleApiError } from "@/lib/utils/handleError";

export async function POST(req: Request) {
	try {
		const { email, password, rememberMe } = await req.json();
		const { t } = await getApiI18nContext(req);
		const data = await authService.login({ email, password, rememberMe }, t);
		return sendSuccess(data, t("auth.login.success"));
	} catch (err) {
		return handleApiError(err);
	}
}
