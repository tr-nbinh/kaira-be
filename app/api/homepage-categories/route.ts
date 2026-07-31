import { getLocaleFromRequest } from "@/lib/helpers/api-i18n-context";
import { CategoryService } from "@/lib/services/category.service";
import { sendSuccess } from "@/lib/utils/api-response";
import { handleApiError } from "@/lib/utils/handleError";

export async function GET(req: Request) {
	try {
		const locale = getLocaleFromRequest(req);
		const data = await CategoryService.getHomepageCategories(locale);
		return sendSuccess(data);
	} catch (error) {
		return handleApiError(error);
	}
}
