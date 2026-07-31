import { db } from "../db";
import { PagingRequest } from "../validations/base.validation";

export const wishlistService = {
	async getWishlistItems(params: PagingRequest, userId: number, locale: string) {
		const wishlistPromise = db.wishlists.findMany({
			where: { user_id: userId },
			select: {
				id: true,
				product_variants: {
					select: {
						id: true,
						stock: true,
						price: true,
						compare_at_price: true,
						option_value_ids: true,
						products: {
							select: {
								id: true,

								variantImages: {
									select: { url: true, is_main: true, attributeValueId: true },
									orderBy: [{ is_main: "desc" }, { id: "asc" }],
								},

								product_translations: {
									where: { language_code: locale },
									select: {
										name: true,
										slug: true,
									},
								},
							},
						},
					},
				},
			},
			skip: (params.page - 1) * params.limit,
			take: params.limit,
		});
		const [wishlistItems, totalItems] = await Promise.all([
			wishlistPromise,
			db.wishlists.count({
				where: { user_id: userId },
			}),
		]);

		if (!wishlistItems.length) {
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

		const allOptionIds = Array.from(
			new Set(wishlistItems.flatMap((p) => p.product_variants.option_value_ids as string[])),
		);
		const attributeValues = await db.attribute_values.findMany({
			where: { id: { in: allOptionIds } },
			select: {
				id: true,
				attributes: { select: { slug: true } },
				attribute_value_translations: {
					where: { language_code: locale },
					select: {
						name: true,
					},
				},
			},
		});

		const result = wishlistItems.map((item) => {
			const vOptionIds = item.product_variants.option_value_ids as string[];
			const colorObj = attributeValues.find((av) => vOptionIds.includes(av.id) && av.attributes.slug === "color");
			const sizeObj = attributeValues.find((av) => vOptionIds.includes(av.id) && av.attributes.slug === "size");
			const color = colorObj?.attribute_value_translations[0].name!;
			const size = sizeObj?.attribute_value_translations[0].name;
			const variantSummary = size ? `${color} - ${size}` : color;
			let targetImage = item.product_variants.products.variantImages.find((img) =>
				vOptionIds.includes(img.attributeValueId!),
			);

			return {
				id: item.id,
				name: item.product_variants.products.product_translations[0].name,
				slug: item.product_variants.products.product_translations[0].slug,
				productId: item.product_variants.products.id,
				variantId: item.product_variants.id,
				stock: item.product_variants.stock,
				price: item.product_variants.price.toNumber(),
				salePrice: item.product_variants.compare_at_price?.toNumber() ?? null,
				imageUrl: targetImage?.url || "",
				currency: "VND",
				variantSummary,
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

	async addToWishlist(variantId: string, userId: number) {
		const existingWishlist = await db.wishlists.findUnique({
			where: {
				user_id_variant_id: {
					user_id: userId,
					variant_id: variantId,
				},
			},
		});

		return await db.$transaction(async (tx) => {
			let isWishlisted = false;

			if (existingWishlist) {
				await tx.wishlists.delete({
					where: { id: existingWishlist.id },
				});
				isWishlisted = false;
			} else {
				await tx.wishlists.create({
					data: { user_id: userId, variant_id: variantId },
				});
				isWishlisted = true;
			}

			// 3. Lấy tổng số lượng wishlist của User sau khi thay đổi
			const wishlistCount = await tx.wishlists.count({
				where: { user_id: userId },
			});

			return { isWishlisted, wishlistCount };
		});
	},

	async getWishlistCount(userId: number) {
		const wishlistCount = await db.wishlists.count({
			where: { user_id: userId },
		});

		return { wishlistCount };
	},
};
