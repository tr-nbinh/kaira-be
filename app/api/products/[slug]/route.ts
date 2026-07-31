import { getLocaleFromRequest } from "@/lib/helpers/api-i18n-context";
import { productService } from "@/lib/services/product.service";
import { sendSuccess } from "@/lib/utils/api-response";
import { getAuthenticatedUserId } from "@/lib/utils/auth-util";
import { handleApiError } from "@/lib/utils/handleError";
import { SlugSchema } from "@/lib/validations/product.validation";
import { NextRequest } from "next/server";

interface RouteParams {
	slug: string;
}

export async function GET(req: NextRequest, { params }: { params: Promise<RouteParams> }) {
	try {
		const locale = getLocaleFromRequest(req);
		const { slug } = await params;
		const validatedId = SlugSchema.parse({ slug });

		const data = await productService.getProductDetail(validatedId.slug, locale);
		return sendSuccess(data, "Get product detail successfully");
	} catch (err) {
		return handleApiError(err);
	}
}
