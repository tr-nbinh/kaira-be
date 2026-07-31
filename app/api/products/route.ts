import { db } from "@/lib/db";
import { getLocaleFromRequest } from "@/lib/helpers/api-i18n-context";
import { GetProductsOptions, productService } from "@/lib/services/product.service";
import { sendSuccess } from "@/lib/utils/api-response";
import { getAuthenticatedUserId } from "@/lib/utils/auth-util";
import { handleApiError } from "@/lib/utils/handleError";
import { ProductFilterSchema } from "@/lib/validations/product.validation";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const rawParams = Object.fromEntries(searchParams.entries());
		const filters = ProductFilterSchema.parse(rawParams);
		const userId = getAuthenticatedUserId(req);
		const locale = getLocaleFromRequest(req);

		const options: GetProductsOptions = { locale, userId, filters };
		const data = await productService.getProducts(options);
		return sendSuccess(data, "Get products successfully");
	} catch (error) {
		return handleApiError(error);
	}
}

export async function POST(req: Request) {
	try {
		const body: {
			brand_id: string;
			status: string;
			is_best_seller: boolean;
			categoryId: string;
			product_translations: any;
			product_variants: any;
		} = await req.json();

		const product = await db.products.create({
			data: {
				brand_id: body.brand_id,
				status: "active",
				is_best_seller: body.is_best_seller,

				// -----------------------------------------------
				// Product translations
				// -----------------------------------------------
				product_translations: body.product_translations,

				// -----------------------------------------------
				// Category: women-tops
				// -----------------------------------------------
				product_categories: {
					create: {
						category_id: body.categoryId,
					},
				},

				// -----------------------------------------------
				// Variants
				// -----------------------------------------------
				product_variants: body.product_variants,
			},

			include: {
				product_translations: true,
				product_categories: true,
				product_variants: true,
			},
		});

		return sendSuccess(product);
	} catch (error) {
		return handleApiError(error);
	}
}
