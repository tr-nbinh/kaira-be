import { Prisma, product_status } from "@prisma/client";
import { ProductFilter } from "../validations/product.validation";

export function buildProductWhere(
	params: ProductFilter,
	locale: string,
	categoryPath?: string,
): Prisma.productsWhereInput {
	const where: Prisma.productsWhereInput = {
		status: product_status.active,
		...(params.bestSeller && { is_best_seller: true }),

		product_categories: !categoryPath
			? undefined
			: {
					some: {
						categories: {
							translations: {
								some: { path: categoryPath, languageCode: locale },
							},
						},
					},
				},
	};

	return where;
}

// 1. Kiểm tra xem user có đang dùng bất kỳ filter nào liên quan đến variant không

export function buildVariantWhere(params: ProductFilter): Prisma.product_variantsWhereInput {
	const hasVariantFilter = !!(
		params.colors?.length ||
		params.sizes?.length ||
		params.minPrice !== undefined ||
		params.maxPrice !== undefined
	);
	const where: Prisma.product_variantsWhereInput = {
		status: product_status.active,
		is_default: hasVariantFilter ? undefined : true,
		...((params.minPrice !== undefined || params.maxPrice !== undefined) && {
			price: { gte: params.minPrice, lte: params.maxPrice },
		}),
		AND: [
			...(params.colors?.length ? [{ option_value_ids: { hasSome: params.colors } }] : []),
			...(params.sizes?.length ? [{ option_value_ids: { hasSome: params.sizes } }] : []),
		],
	};

	return where;
}
