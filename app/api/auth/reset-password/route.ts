import { getApiI18nContext } from "@/lib/helpers/api-i18n-context";
import { authService } from "@/lib/services/auth.service";
import { sendSuccess } from "@/lib/utils/api-response";
import { handleApiError } from "@/lib/utils/handleError";
import { ResetPasswordSchema } from "@/lib/validations/auth.validation";

export async function POST(req: Request) {
	try {
		const { token, password, confirmPassword } = await req.json();
		const validatedData = ResetPasswordSchema.parse({ token, password, confirmPassword });
		const { t } = await getApiI18nContext(req);
		const data = await authService.resetPassword(validatedData, t);
		return sendSuccess(data, t("auth.reset_password.succes"));
	} catch (error) {
		return handleApiError(error);
	}
}
