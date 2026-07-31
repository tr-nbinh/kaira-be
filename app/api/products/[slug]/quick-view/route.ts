import { getLocaleFromRequest } from "@/lib/helpers/api-i18n-context";
import { productService } from "@/lib/services/product.service";
import { sendSuccess } from "@/lib/utils/api-response";
import { getAuthenticatedUserId } from "@/lib/utils/auth-util";
import { handleApiError } from "@/lib/utils/handleError";
import { SlugSchema } from "@/lib/validations/product.validation";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
	try {
		const { slug } = await params;
		const locale = getLocaleFromRequest(req);
		const validatedSlug = SlugSchema.parse({ slug });
		const userId = getAuthenticatedUserId(req);
		console.log("userId", userId);
		const data = await productService.findMinimalProductById(validatedSlug.slug, locale, userId);
		return sendSuccess(data);
	} catch (error) {
		return handleApiError(error);
	}
}
