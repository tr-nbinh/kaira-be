import { getApiI18nContext } from "@/lib/helpers/api-i18n-context";
import { authService } from "@/lib/services/auth.service";
import { sendSuccess } from "@/lib/utils/api-response";
import { handleApiError } from "@/lib/utils/handleError";
import { ResendEmailSchema } from "@/lib/validations/auth.validation";

export async function POST(req: Request) {
	try {
		const { t } = await getApiI18nContext(req);
		const { email } = await req.json();
		const validatedData = ResendEmailSchema.parse({ email });
		const data = await authService.resendEmail(validatedData.email, t);
		return sendSuccess(data, t("auth.verify.sent"));
	} catch (error) {
		return handleApiError(error);
	}
}
