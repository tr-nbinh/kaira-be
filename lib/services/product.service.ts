import { db } from "../db";
import { buildProductWhere, buildVariantWhere } from "../helpers/build-product-where.helper";
import { ProductFilter } from "../validations/product.validation";

export interface GetProductsOptions {
	locale: string;
	filters: ProductFilter; // Đổi thành optional nếu có thể không lọc gì
	categoryPath?: string;
	userId?: number;
}

export const productService = {
	async getProducts(option: GetProductsOptions) {
		const { locale, categoryPath, filters: params, userId } = option;
		const productsWhere = buildProductWhere(params, locale, categoryPath);
		const variantWhere = buildVariantWhere(params);

		const productsPromise = db.products.findMany({
			where: { ...productsWhere, product_variants: { some: variantWhere } },
			skip: (params.page - 1) * params.limit,
			take: params.limit,
			orderBy: { created_at: "desc" },
			select: {
				id: true,
				is_best_seller: true,

				variantImages: {
					select: {
						id: true,
						is_main: true,
						is_hover: true,
						url: true,
						attributeValueId: true,
					},
				},
				product_translations: {
					where: { language_code: locale },
					select: {
						name: true,
						slug: true,
					},
				},
				product_variants: {
					where: variantWhere,
					distinct: ["product_id"],
					take: 1,
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
					},
				},
			},
		});
		const [products, totalItems] = await Promise.all([
			productsPromise,
			db.products.count({
				where: {
					...productsWhere,
					product_variants: { some: variantWhere },
				},
			}),
		]);
		if (!products.length) {
			return {
				data: [],
				meta: {
					limit: params.limit,
					page: params.page,
					totalCount: 0,
					totalPages: 0,
				},
			};
		}

		const result = products.map((p) => {
			const variant = p.product_variants[0];
			const images = p.variantImages.filter((i) =>
				(variant.option_value_ids as string[]).includes(i.attributeValueId || ""),
			);
			const primaryImage = images.find((image) => image.is_main)!;
			const secondImage = images.find((image) => image.is_hover)!;

			return {
				id: p.id,
				variantId: variant.id,
				...p.product_translations[0],
				isBestSeller: p.is_best_seller,
				primaryImageUrl: primaryImage.url,
				secondImageUrl: secondImage.url,
				price: variant.price.toNumber(),
				compareAtPrice:
					variant.compare_at_price && variant.compare_at_price > variant.price
						? variant.compare_at_price.toNumber()
						: null,
				discountPercent: variant.discount_percent,
				currency: "VND",
				isWishlisted: Array.isArray(variant.wishlists) && variant.wishlists.length > 0,
			};
		});

		return {
			data: result,
			meta: {
				limit: params.limit,
				page: params.page,
				totalCount: totalItems,
				totalPages: Math.ceil(totalItems / params.limit),
			},
		};
	},

	async getProductDetail(id: string, locale: string, userId?: number) {
		const product = await this.findProductDetail(id, locale, userId);
		const attributeValues = await this.getAttributeValues(product.product_variants, locale);
		const { valueMap, colors, sizes } = this.buildAttributeData(attributeValues);
		const variants = this.buildVariants(product.product_variants, valueMap);
		const translation = product.product_translations[0];

		let specifications: any | undefined = undefined;
		if (product.productSpecifications) {
			specifications = this.formatSpecifications(product.productSpecifications, locale);
		}

		return {
			id: product.id,
			name: translation.name ?? "",
			slug: translation.slug ?? "",
			images: product.variantImages,
			brandName: product.brand?.name,
			description: translation.description ?? "",
			content: translation.content ?? "",
			isBestSeller: product.is_best_seller,
			currency: "VND",
			colors,
			sizes,
			variants,
			specifications,
			categoryType: product.product_categories[0].categories.categoryType,
			gender: product.product_categories[0].categories.gender,
		};
	},

	formatSpecifications(specs: any, locale: string) {
		const groupedMap = new Map<string, string[]>();

		for (const item of specs) {
			const keyTitle = item.key.translations[0]?.title || item.key.code;

			if (!groupedMap.has(keyTitle)) {
				groupedMap.set(keyTitle, []);
			}

			// 1. Trường hợp là Master Data (label) -> Giữ nguyên 100%, KHÔNG split
			if (item.value?.translations[0]?.label) {
				groupedMap.get(keyTitle)!.push(item.value.translations[0].label);
			}
			// 2. Trường hợp là customValue (JSON) -> Tiến hành split theo dấu phẩy
			else if (item.customValue) {
				const rawCustom = (item.customValue as Record<string, string>)?.[locale] || "";
				if (rawCustom) {
					const parsedValues = rawCustom
						.split(",")
						.map((v) => v.trim())
						.filter((v) => v.length > 0);

					groupedMap.get(keyTitle)!.push(...parsedValues);
				}
			}
		}

		// Chuyển sang mảng danh sách cho FE dễ map
		return Array.from(groupedMap.entries()).map(([title, values]) => ({
			title, // "Composition"
			values, // ["97% Wool", "3% Polyamide"]
			displayValue: values.join(", "), // "97% Wool, 3% Polyamide"
		}));
	},

	async findMinimalProductById(id: string, locale: string, userId?: number) {
		const product = await this.getMinimalProduct(id, locale, userId);
		const attributeValues = await this.getAttributeValues(product.product_variants, locale);
		const { valueMap, colors, sizes } = this.buildAttributeData(attributeValues);
		const variants = this.buildVariants(product.product_variants, valueMap);
		const translation = product.product_translations[0];

		return {
			id: product.id,
			name: translation.name ?? "",
			slug: translation.slug ?? "",
			images: product.variantImages,
			brandName: product.brand?.name,
			categoryName: product.product_categories[0].categories.translations[0].name || "",
			description: translation.description ?? "",
			isBestSeller: product.is_best_seller,
			currency: "VND",
			colors,
			sizes,
			variants,
		};
	},

	buildAttributeData(attributeValues: any[]) {
		const valueMap = new Map<string, any>();

		const colors: any[] = [];
		const sizes: any[] = [];

		for (const value of attributeValues) {
			valueMap.set(value.id, value);

			const option = {
				id: value.id,
				name: value.attribute_value_translations[0]?.name ?? "",
				value_code: value.value_code,
			};

			switch (value.attributes.slug) {
				case "color":
					colors.push(option);
					break;

				case "size":
				case "shoes-size":
					sizes.push(option);
					break;
			}
		}

		return {
			valueMap,
			colors,
			sizes,
		};
	},

	async getAttributeValues(
		variants: {
			option_value_ids: string[];
		}[],
		locale: string,
	) {
		const ids = [...new Set(variants.flatMap((v) => v.option_value_ids))];

		return db.attribute_values.findMany({
			where: {
				id: {
					in: ids,
				},
			},
			include: {
				attributes: true,
				attribute_value_translations: {
					where: {
						language_code: locale,
					},
					select: {
						name: true,
					},
				},
			},
		});
	},

	buildVariants(variants: any[], valueMap: Map<string, any>) {
		return variants.map((variant) => {
			let color: any | undefined;
			let size: any | undefined;
			let specifications: any | undefined = undefined;

			if (variant.specifications) {
				specifications = variant.specifications.map((spec: any) => ({
					id: spec.id,
					title: spec.translations[0]?.title ?? "",
					hasLabel: spec.items.some((i: any) => i.translations[0]?.label),
					items: spec.items.map((item: any) => ({
						id: item.id,
						label: item.translations[0]?.label ?? null,
						value: item.translations[0]?.value ?? "",
					})),
				}));
			}

			for (const id of variant.option_value_ids) {
				const value = valueMap.get(id);

				if (!value) continue;

				const option = {
					id: value.id,
					name: value.attribute_value_translations[0]?.name ?? "",
					value_code: value.value_code,
				};

				switch (value.attributes.slug) {
					case "color":
						color = option;
						break;

					case "size":
					case "shoes-size":
						size = option;
						break;
				}
			}

			return {
				id: variant.id,
				sku: variant.sku,
				stock: variant.stock,
				price: variant.price.toNumber(),
				salePrice: variant.compare_at_price?.toNumber(),
				isDefault: variant.is_default,
				color,
				size,
				specifications,
				isWishlisted: Array.isArray(variant.wishlists) && variant.wishlists.length > 0,
			};
		});
	},

	async getFilterMetadata(locale: string) {
		const pricePromise = db.product_variants.aggregate({
			_min: {
				price: true,
			},
			_max: {
				price: true,
			},
		});
		const colorsPromise = db.attribute_values.findMany({
			where: {
				attributes: { slug: "color" },
			},
			select: {
				id: true,
				value_code: true,
				attribute_value_translations: {
					where: { language_code: locale },
					select: {
						name: true,
					},
				},
			},
			orderBy: {
				sort_order: "asc",
			},
		});
		const sizesPromise = db.attribute_values.findMany({
			where: {
				attributes: { slug: "size" },
			},
			select: {
				id: true,
				value_code: true,
				attribute_value_translations: {
					where: { language_code: locale },
					select: {
						name: true,
					},
				},
			},
			orderBy: {
				sort_order: "asc",
			},
		});
		const [priceResult, colors, sizes] = await Promise.all([pricePromise, colorsPromise, sizesPromise]);
		const colorsFormatted = colors.map((c) => ({
			id: c.id,
			name: c.attribute_value_translations[0].name || "",
			value_code: c.value_code,
		}));
		const sizessFormatted = sizes.map((s) => ({
			id: s.id,
			name: s.attribute_value_translations[0].name || "",
			value_code: s.value_code,
		}));
		return {
			priceRange: { min: priceResult._min.price ?? 0, max: priceResult._max.price ?? 50000000 },
			colors: colorsFormatted,
			sizes: sizessFormatted,
		};
	},

	async findProductDetail(id: string, locale: string, userId?: number) {
		return db.products.findUniqueOrThrow({
			where: {
				id,
				status: "active",
			},
			select: {
				id: true,
				is_best_seller: true,

				variantImages: {
					orderBy: {
						displayOrder: "asc",
					},
					select: {
						id: true,
						is_main: true,
						url: true,
						attributeValueId: true,
					},
				},

				product_translations: {
					where: {
						language_code: locale,
					},
					select: {
						name: true,
						slug: true,
						description: true,
						content: true,
					},
				},

				brand: {
					select: {
						name: true,
					},
				},

				product_variants: {
					select: {
						id: true,
						sku: true,
						price: true,
						compare_at_price: true,
						stock: true,
						is_default: true,
						option_value_ids: true,

						wishlists: userId ? { where: { user_id: userId }, select: { id: true } } : false,
					},
				},

				product_categories: {
					select: {
						categories: {
							select: {
								gender: true,
								categoryType: true,
								translations: { where: { languageCode: locale }, select: { name: true } },
							},
						},
					},
				},

				productSpecifications: {
					select: {
						key: {
							select: {
								code: true,
								translations: {
									where: { languageCode: locale },
									select: { title: true },
								},
							},
						},
						value: {
							select: {
								translations: {
									where: { languageCode: locale },
									select: { label: true },
								},
							},
						},
						customValue: true,
					},
				},
			},
		});
	},

	async getMinimalProduct(id: string, locale: string, userId?: number) {
		return db.products.findUniqueOrThrow({
			where: {
				id,
				status: "active",
			},
			select: {
				id: true,
				is_best_seller: true,

				variantImages: {
					orderBy: {
						displayOrder: "asc",
					},
					select: {
						id: true,
						is_main: true,
						url: true,
						attributeValueId: true,
					},
				},

				product_translations: {
					where: {
						language_code: locale,
					},
					select: {
						name: true,
						slug: true,
						description: true,
					},
				},

				brand: {
					select: {
						name: true,
					},
				},

				product_variants: {
					select: {
						id: true,
						sku: true,
						price: true,
						compare_at_price: true,
						stock: true,
						is_default: true,
						option_value_ids: true,

						wishlists: userId
							? {
									where: { user_id: userId },
									select: { id: true },
								}
							: false,
					},
				},

				product_categories: {
					select: {
						categories: {
							select: { translations: { where: { languageCode: locale }, select: { name: true } } },
						},
					},
				},
			},
		});
	},
};
