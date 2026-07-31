import { getLocaleFromRequest } from "@/lib/helpers/api-i18n-context";
import { GetProductsOptions, productService } from "@/lib/services/product.service";
import { sendSuccess } from "@/lib/utils/api-response";
import { getAuthenticatedUserId } from "@/lib/utils/auth-util";
import { handleApiError } from "@/lib/utils/handleError";
import { ProductFilterSchema } from "@/lib/validations/product.validation";
import { NextRequest } from "next/server";

type RouteParams = {
	params: Promise<{
		categoryPath: string[];
	}>;
};

export async function GET(req: NextRequest, { params }: RouteParams) {
	try {
		const { searchParams } = new URL(req.url);
		const rawParams = Object.fromEntries(searchParams.entries());
		const filters = ProductFilterSchema.parse(rawParams);

		const { categoryPath } = await params;
		const path = `/${categoryPath.join("/")}`;

		const userId = getAuthenticatedUserId(req);
		const locale = getLocaleFromRequest(req);

		const options: GetProductsOptions = { locale, userId, filters, categoryPath: path };
		const data = await productService.getProducts(options);
		return sendSuccess(data, "Get products successfully");
	} catch (error) {
		return handleApiError(error);
	}
}
