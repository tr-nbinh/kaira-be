import { db } from "../db";

export const wishlistService = {
	async getWishlistItems(userId: number, locale: string) {
		const items = await db.wishlists.findMany({
			where: { user_id: userId },
			select: {
				id: true,
				product_variants: {
					select: {
						id: true,
						stock: true,
						option_value_ids: true,
						variant_images: {
							select: {
								url: true,
							},
							orderBy: [{ is_main: "desc" }, { id: "asc" }],
							take: 1,
						},
						products: {
							select: {
								id: true,
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
		});

		const allOptionIds = Array.from(new Set(items.flatMap((p) => p.product_variants.option_value_ids as string[])));
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

		const result = items.map((item) => {
			const vOptionIds = item.product_variants.option_value_ids as string[];
			const colorObj = attributeValues.find((av) => vOptionIds.includes(av.id) && av.attributes.slug === "color");
			const sizeObj = attributeValues.find((av) => vOptionIds.includes(av.id) && av.attributes.slug === "size");

			return {
				id: item.id,
				name: item.product_variants.products.product_translations[0].name,
				slug: item.product_variants.products.product_translations[0].slug,
				productId: item.product_variants.products.id,
				variantId: item.product_variants.id,
				stock: item.product_variants.stock,
				imageUrl: item.product_variants.variant_images[0].url || "",
				color: colorObj?.attribute_value_translations[0].name || null,
				size: sizeObj?.attribute_value_translations[0].name || null,
			};
		});

		return result;
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
