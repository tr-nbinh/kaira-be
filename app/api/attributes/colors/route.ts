import { getLocaleFromRequest } from "@/lib/helpers/api-i18n-context";
import { attributeService } from "@/lib/services/attribute.service";
import { sendSuccess } from "@/lib/utils/api-response";
import { handleApiError } from "@/lib/utils/handleError";

export async function GET(req: Request) {
	try {
		const locale = getLocaleFromRequest(req);
		const data = await attributeService.getColors(locale);
		return sendSuccess(data, "Get colors successfully");
	} catch (error) {
		return handleApiError(error);
	}
}
