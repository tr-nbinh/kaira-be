import { getLocaleFromRequest } from "@/lib/helpers/api-i18n-context";
import { productService } from "@/lib/services/product.service";
import { sendSuccess } from "@/lib/utils/api-response";
import { getAuthenticatedUserId } from "@/lib/utils/auth-util";
import { handleApiError } from "@/lib/utils/handleError";
import { productDetailSchema } from "@/lib/validations/product.validation";
import { NextRequest } from "next/server";

interface RouteParams {
	id: string;
}

export async function GET(req: NextRequest, { params }: { params: Promise<RouteParams> }) {
	try {
		const locale = getLocaleFromRequest(req);
		const userId = getAuthenticatedUserId(req);

		const { id } = await params;
		const validatedId = productDetailSchema.parse({ id });

		const data = await productService.getProductById(validatedId.id, locale, userId);
		return sendSuccess(data, "Get product detail successfully");
	} catch (err) {
		return handleApiError(err);
	}
}
