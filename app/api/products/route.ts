import { db } from "@/lib/db";
import { getProducts } from "@/lib/services/productService";
import { handleApiError } from "@/lib/utils/handleError";
import { GetProductsOptions } from "@/models/product.model";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
	const { searchParams } = new URL(req.url);
	// Parse price filter: price=<20, price=40-60, price=>100, price=20, etc.
	// Parse multiple price ranges: /api/products?price=<20&price=40-60
	const priceParams = searchParams.get("prices")?.split(",");
	const priceRanges = priceParams
		?.map((param) => {
			if (param.startsWith("<")) {
				return { max: parseFloat(param.substring(1)) };
			} else if (param.startsWith(">")) {
				return { min: parseFloat(param.substring(1)) };
			} else if (param.includes("-")) {
				const [min, max] = param.split("-").map(Number);
				return { min: isNaN(min) ? undefined : min, max: isNaN(max) ? undefined : max };
			} else {
				const val = parseFloat(param);
				return isNaN(val) ? {} : { min: val, max: val };
			}
		})
		.filter((r) => r.min !== undefined || r.max !== undefined);

	const options: GetProductsOptions = {
		lang: searchParams.get("lang") || undefined,
		page: searchParams.get("page") ? parseInt(searchParams.get("page") as string, 10) : undefined,
		limit: searchParams.get("limit") ? parseInt(searchParams.get("limit") as string, 10) : undefined,
		bestSeller:
			searchParams.get("bestSeller") === "true"
				? true
				: searchParams.get("bestSeller") === "false"
				? false
				: undefined,
		bestReviewed:
			searchParams.get("bestReviewed") === "true"
				? true
				: searchParams.get("bestReviewed") === "false"
				? false
				: undefined,
		isNewArrival:
			searchParams.get("isNewArrival") === "true"
				? true
				: searchParams.get("isNewArrival") === "false"
				? false
				: undefined,
		categoryIds: searchParams
			.get("categoryIds")
			?.split(",")
			.map((id) => parseInt(id, 10))
			.filter((id) => !isNaN(id)),
		colorIds: searchParams
			.get("colorIds")
			?.split(",")
			.map((id) => parseInt(id, 10))
			.filter((id) => !isNaN(id)),
		sizeIds: searchParams
			.get("sizeIds")
			?.split(",")
			.map((id) => parseInt(id, 10))
			.filter((id) => !isNaN(id)),
		brandIds: searchParams
			.get("brandIds")
			?.split(",")
			.map((id) => parseInt(id, 10))
			.filter((id) => !isNaN(id)),
		priceRanges: priceRanges && priceRanges.length ? priceRanges : undefined,
	};
    console.log(priceRanges)
	try {
		const result = await getProducts(options);
		return Response.json(result);
	} catch (err) {
		return handleApiError(err);
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
