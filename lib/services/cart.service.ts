import { getVndToUsdRate } from "../currency";
import { db } from "../db";
import { ApiError } from "../utils/api-error";
import { PagingRequest } from "../validations/base.validation";

export const cartService = {
	async getCartItems(params: PagingRequest, userId: number, locale: string) {
		const itemsPromise = db.cartItem.findMany({
			where: { cart: { userId } },
			skip: params.limit * (params.page - 1),
			take: params.limit,
			select: {
				id: true,
				quantity: true,
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
									select: { name: true, slug: true },
								},
							},
						},
					},
				},
			},
		});

		const [cartItems, totalItems] = await Promise.all([
			itemsPromise,
			db.cartItem.count({
				where: {
					cart: {
						userId,
					},
				},
			}),
		]);

		if (!cartItems.length) {
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
			new Set(cartItems.flatMap((item) => item.product_variants.option_value_ids as string[])),
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

		const result = cartItems.map((cartItem) => {
			const variant = cartItem.product_variants;
			const vOptionIds = variant.option_value_ids as string[];
			const colorObj = attributeValues.find((av) => vOptionIds.includes(av.id) && av.attributes.slug === "color");
			const sizeObj = attributeValues.find((av) => vOptionIds.includes(av.id) && av.attributes.slug === "size");
			const color = colorObj?.attribute_value_translations[0].name!;
			const size = sizeObj?.attribute_value_translations[0].name;
			const variantSummary = size ? `${color} - ${size}` : color;
			const targetImage = cartItem.product_variants.products.variantImages.find((img) =>
				vOptionIds.includes(img.attributeValueId!),
			)!;

			return {
				id: cartItem.id,
				variantId: variant.id,
				productId: variant.products.id,
				slug: variant.products.product_translations[0].slug || "",
				name: variant.products.product_translations[0].name || "",
				color: colorObj?.attribute_value_translations[0].name || null,
				size: sizeObj?.attribute_value_translations[0].name || null,
				stock: variant.stock,
				price: Number(variant.price),
				quantity: cartItem.quantity,
				imageUrl: targetImage.url || "",
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

	async addToCart(userId: number, variantId: string, quantity: number, t: Function) {
		return await db.$transaction(async (tx) => {
			const variant = await tx.product_variants.findFirst({
				where: { id: variantId },
			});
			if (!variant) {
				throw new ApiError(t("cart.item_not_found"), 404);
			}
			if (quantity > variant.stock) {
				throw new ApiError(t("cart.amount_invalid"), 400);
			}

			let cart = await tx.cart.findFirst({
				where: { userId: userId },
			});
			if (!cart) {
				cart = await tx.cart.create({
					data: { userId: userId },
				});
			}

			const existingItem = await tx.cartItem.findFirst({
				where: { cartId: cart.id, variantId: variantId },
			});
			if (existingItem) {
				const finalQuantity = quantity + existingItem.quantity;
				if (finalQuantity > variant.stock) {
					throw new ApiError(t("cart.amount_invalid"), 400);
				}
				await tx.cartItem.update({
					where: { id: existingItem.id },
					data: { quantity: finalQuantity },
				});
			} else {
				await tx.cartItem.create({
					data: { cartId: cart.id, variantId: variantId, quantity: quantity },
				});
			}

			const cartCount = await tx.cartItem.count({
				where: { cartId: cart.id },
			});

			return { count: cartCount };
		});
	},

	async getCartCount(userId: number) {
		const cart = await db.cart.findFirst({
			where: { userId: userId },
		});
		if (!cart) {
			return { cartCount: 0 };
		}

		const cartCount = await db.cartItem.count({
			where: { cartId: cart.id },
		});

		return { cartCount };
	},

	async updateQuantity(userId: number, cartItemId: string, quantity: number) {
		const cart = await db.cart.findFirst({
			where: { userId: userId },
		});
		if (!cart) {
			throw new ApiError("Product not found in cart", 404);
		}

		const cartItem = await db.cartItem.findFirst({
			where: { id: cartItemId },
			select: { variantId: true },
		});
		if (!cartItem) {
			throw new ApiError("Product not found in cart", 404);
		}

		const variant = await db.product_variants.findFirst({
			where: { id: cartItem.variantId },
			select: { stock: true },
		});
		if (!variant) {
			throw new ApiError("Product has been archived", 404);
		}

		if (quantity > variant.stock) {
			throw new ApiError(`Only ${variant.stock} items left in stock.`, 402);
		}

		await db.cartItem.update({
			where: { id: cartItemId },
			data: { quantity },
		});

		return { quantity };
	},

	async deleteItem(userId: number, cartItemId: string) {
		const deletedItems = await db.cartItem.deleteMany({
			where: { id: cartItemId, cart: { userId: userId } },
		});
		if (deletedItems.count == 0) {
			throw new ApiError("Product not found in your cart", 404);
		}

		const cart = await db.cart.findUnique({
			where: { userId: userId },
			select: {
				id: true,
				items: {
					select: {
						quantity: true,
						product_variants: {
							select: {
								price: true,
							},
						},
					},
				},
			},
		});
		if (!cart) {
			throw new ApiError("Your cart is empty", 404);
		}
		const cartCount = await db.cartItem.count({ where: { cartId: cart.id } });

		return { cartCount };
	},
};
