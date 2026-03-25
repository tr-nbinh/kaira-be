import { getVndToUsdRate } from "../currency";
import { db } from "../db";
import { ApiError } from "../utils/api-error";

export const productService = {
	async getProducts(locale: string, params: any, userId?: number) {
		const products = await db.products.findMany({
			where: { status: "active" },
			select: {
				id: true,
				product_translations: {
					where: { language_code: locale },
					select: {
						name: true,
						slug: true,
						description: true,
						content: true,
					},
				},
				product_variants: {
					select: {
						id: true,
						sku: true,
						price: true,
						compare_at_price: true,
						discount_percent: true,
						stock: true,
						option_value_ids: true,
						wishlists: userId
							? {
									where: { user_id: userId },
									select: { id: true },
								}
							: false,
						variant_images: {
							select: {
								id: true,
								url: true,
								is_main: true,
							},
						},
					},
				},
			},
		});
		if (!products.length) return [];

		const usdRate = await getVndToUsdRate();
		const isEn = locale == "en";

		const allOptionIds = Array.from(
			new Set(products.flatMap((p) => p.product_variants.flatMap((v) => v.option_value_ids as string[]))),
		);

		const attributeValues = await db.attribute_values.findMany({
			where: { id: { in: allOptionIds } },
			select: {
				id: true,
				value_code: true,
				attributes: { select: { slug: true } },
				attribute_value_translations: {
					where: { language_code: locale },
					select: {
						name: true,
					},
				},
			},
		});
		const availableColors = attributeValues
			.filter((av) => av.attributes.slug === "color")
			.map((av) => ({ id: av.id, value_code: av.value_code, name: av.attribute_value_translations[0].name }));

		const result = products.map((p) => {
			const pOptionIds = new Set(p.product_variants.flatMap((v) => v.option_value_ids as string[]));
			const productAvailableColors = availableColors.filter((ac) => pOptionIds.has(ac.id));
			return {
				id: p.id,
				...p.product_translations[0],
				availableColors: productAvailableColors,
				variants: p.product_variants.map((v) => {
					const vOptionIds = v.option_value_ids as string[];

					// Tìm tên Color và Size dựa trên ID trong option_value_ids
					const colorObj = attributeValues.find(
						(av) => vOptionIds.includes(av.id) && av.attributes.slug === "color",
					);
					const sizeObj = attributeValues.find(
						(av) => vOptionIds.includes(av.id) && av.attributes.slug === "size",
					);

					return {
						id: v.id,
						sku: v.sku,
						stock: v.stock,
						isFavorite: (v.wishlists && v.wishlists.length > 0) || false,
						price: v.price,
						compareAtPrice: v.compare_at_price,
						discountPercent: v.discount_percent,
						displayPrice: isEn ? parseFloat((Number(v.price) * usdRate).toFixed(2)) : v.price,
						displayCompareAtPrice: v.compare_at_price
							? isEn
								? parseFloat((Number(v.price) * usdRate).toFixed(2))
								: v.price
							: null,
						currency: isEn ? "USD" : "VND",
						colorId: colorObj?.id,
						size: sizeObj?.attribute_value_translations[0]?.name || null,
						images: v.variant_images, // Đã lấy tất cả ảnh và sắp xếp
					};
				}),
			};
		});

		return result;
	},

	async getProductById(id: string, locale: string, userId?: number) {
		const product = await db.products.findFirst({
			where: { id: id, status: "active" },
			select: {
				id: true,
				product_translations: {
					where: { language_code: locale },
					select: {
						name: true,
						slug: true,
						description: true,
						content: true,
					},
				},
				product_variants: {
					select: {
						id: true,
						sku: true,
						price: true,
						compare_at_price: true,
						discount_percent: true,
						stock: true,
						option_value_ids: true,
						wishlists: userId
							? {
									where: { user_id: userId },
									select: { id: true },
								}
							: false,
						variant_images: {
							select: {
								id: true,
								url: true,
								is_main: true,
							},
						},
					},
				},
			},
		});
		if (!product) {
			throw new ApiError("Product not found", 404);
		}

		const usdRate = await getVndToUsdRate();
		const isEn = locale == "en";

		const allOptionIds = Array.from(
			new Set(product.product_variants.flatMap((v) => v.option_value_ids as string[])),
		);

		const attributeValues = await db.attribute_values.findMany({
			where: { id: { in: allOptionIds } },
			select: {
				id: true,
				value_code: true,
				attributes: { select: { slug: true } },
				attribute_value_translations: {
					where: { language_code: locale },
					select: {
						name: true,
					},
				},
			},
		});
		const availableColors = attributeValues
			.filter((av) => av.attributes.slug === "color")
			.map((av) => ({ id: av.id, value_code: av.value_code, name: av.attribute_value_translations[0].name }));

		const variants = product.product_variants.map((v) => {
			const vOptionIds = v.option_value_ids as string[];
			const colorObj = attributeValues.find((av) => vOptionIds.includes(av.id) && av.attributes.slug === "color");
			const sizeObj = attributeValues.find((av) => vOptionIds.includes(av.id) && av.attributes.slug === "size");

			return {
				id: v.id,
				sku: v.sku,
				isFavorite: (v.wishlists && v.wishlists.length > 0) || false,
				price: v.price,
				compareAtPrice: v.compare_at_price,
				discountPercent: v.discount_percent,
				displayPrice: isEn ? parseFloat((Number(v.price) * usdRate).toFixed(2)) : v.price,
				displayCompareAtPrice: v.compare_at_price
					? isEn
						? parseFloat((Number(v.compare_at_price) * usdRate).toFixed(2))
						: v.compare_at_price
					: null,
				currency: isEn ? "USD" : "VND",
				colorId: colorObj?.id,
				size: sizeObj?.attribute_value_translations[0]?.name || null,
				stock: v.stock,
				images: v.variant_images, // Đã lấy tất cả ảnh và sắp xếp
			};
		});

		return { id: product.id, ...product.product_translations[0], availableColors, variants };
	},
};
