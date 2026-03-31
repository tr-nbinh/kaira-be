import { db } from "@/lib/db";
import { getLocaleFromRequest } from "@/lib/helpers/api-i18n-context";
import { productService } from "@/lib/services/product.service";
import { sendSuccess } from "@/lib/utils/api-response";
import { getAuthenticatedUserId } from "@/lib/utils/auth-util";
import { handleApiError } from "@/lib/utils/handleError";
import { ProductFilterSchema } from "@/lib/validations/product.validation";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const rawParams = Object.fromEntries(searchParams.entries());
		const validatedParams = ProductFilterSchema.parse(rawParams);
		console.log(rawParams, validatedParams);
		const userId = getAuthenticatedUserId(req);
		const local = getLocaleFromRequest(req);
		const data = await productService.getProducts(local, validatedParams, userId);
		return sendSuccess(data, "Get products successfully");
	} catch (error) {
		return handleApiError(error);
	}
}

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const { categoryIds, translations, ...productData } = body;

		const result = await db.$transaction(async (tx: any) => {
			// 1. Tạo product
			const product = await tx.products.create({
				data: productData,
			});

			// 2. Tạo các bản ghi product_category
			const categoryRelations = categoryIds.map((category_id: number) => ({
				product_id: product.product_id,
				category_id,
			}));

			await tx.product_category.createMany({
				data: categoryRelations,
			});

			if (translations && Array.isArray(translations)) {
				await tx.product_translations.createMany({
					data: translations.map((t: any) => ({
						product_id: product.product_id,
						language_code: t.language_code,
						name: t.name,
						description: t.description,
						slug: t.slug,
					})),
				});
			}

			return product;
		});

		return Response.json(result, { status: 201 });
	} catch (error) {
		return handleApiError(error);
	}
}
