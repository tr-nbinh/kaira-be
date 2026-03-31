import { getApiI18nContext } from "@/lib/helpers/api-i18n-context";
import { authService } from "@/lib/services/auth.service";
import { sendSuccess } from "@/lib/utils/api-response";
import { handleApiError } from "@/lib/utils/handleError";
import { RegisterSchema } from "@/lib/validations/auth.validation";

export async function POST(req: Request) {
	try {
		const { t } = await getApiI18nContext(req);
		const body = await req.json();
		const validatedData = RegisterSchema.parse(body);
		const data = await authService.register(validatedData, t);
		return sendSuccess(data, t("auth.register.success"), 201);
	} catch (err) {
		return handleApiError(err);
	}
}
