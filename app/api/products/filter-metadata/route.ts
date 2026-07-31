import { getLocaleFromRequest } from "@/lib/helpers/api-i18n-context";
import { productService } from "@/lib/services/product.service";
import { sendSuccess } from "@/lib/utils/api-response";
import { handleApiError } from "@/lib/utils/handleError";

export async function GET(req: Request) {
	try {
		const locale = getLocaleFromRequest(req);
		const data = await productService.getFilterMetadata(locale);
		return sendSuccess(data);
	} catch (error) {
		return handleApiError(error);
	}
}
