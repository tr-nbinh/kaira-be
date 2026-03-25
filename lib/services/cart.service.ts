import { getVndToUsdRate } from "../currency";
import { db } from "../db";
import { ApiError } from "../utils/api-error";

export const cartService = {
	async getCartItems(userId: number, locale: string) {
		const cart = await db.cart.findFirst({
			where: { userId: userId },
			select: {
				items: {
					select: {
						quantity: true,
						product_variants: {
							select: {
								id: true,
								stock: true,
								price: true,
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
				},
			},
		});
		if (!cart) return [];

		const cartItems = cart.items;
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

		const isEn = locale == "en";
		const usdRate = await getVndToUsdRate();

		const subTotal = cartItems.reduce((acc, item) => {
			const finalUnitPrice = isEn
				? Number(item.product_variants.price) * usdRate
				: Number(item.product_variants.price);
			return acc + finalUnitPrice * item.quantity;
		}, 0);

		const result = cartItems.map((cartItem) => {
			const variant = cartItem.product_variants;
			const vOptionIds = variant.option_value_ids as string[];
			const colorObj = attributeValues.find((av) => vOptionIds.includes(av.id) && av.attributes.slug === "color");
			const sizeObj = attributeValues.find((av) => vOptionIds.includes(av.id) && av.attributes.slug === "size");

			return {
				variantId: variant.id,
				productId: variant.products.id,
				slug: variant.products.product_translations[0].slug || "",
				name: variant.products.product_translations[0].name || "",
				color: colorObj?.attribute_value_translations[0].name || null,
				size: sizeObj?.attribute_value_translations[0].name || null,
				stock: variant.stock,
				price: variant.price,
				quantity: cartItem.quantity,
				imageUrl: variant.variant_images[0].url || "",
				displayPrice: isEn ? parseFloat((Number(variant.price) * usdRate).toFixed(2)) : variant.price,
				displayFinalPrice: isEn
					? parseFloat((Number(variant.price) * cartItem.quantity * usdRate).toFixed(2))
					: Number(variant.price) * cartItem.quantity,
				currency: isEn ? "USD" : "VND",
			};
		});
		return { cartItems: result, subTotal: subTotal };
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

			return { cartCount };
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

	async updateQuantity(userId: number, variantId: string, quantity: number, locale: string) {
		const cart = await db.cart.findFirst({
			where: { userId: userId },
		});
		if (!cart) {
			throw new ApiError("Product not found in cart", 404);
		}

		const variant = await db.product_variants.findFirst({
			where: { id: variantId },
			select: { stock: true, price: true },
		});
		if (!variant) {
			throw new ApiError("Product has been archived", 401);
		}

		if (quantity > variant.stock) {
			throw new ApiError(`Only ${variant.stock} items left in stock.`, 402);
		}

		await db.cartItem.update({
			where: { cartId_variantId: { cartId: cart.id, variantId: variantId } },
			data: { quantity },
		});

		const userCart = await db.cartItem.findMany({
			where: { cartId: cart.id },
			include: {
				product_variants: {
					select: {
						price: true,
					},
				},
			},
		});

		const isEn = locale == "en";
		const usdRate = await getVndToUsdRate();
		const subTotal = userCart.reduce((acc, item) => {
			const finalUnitPrice = isEn
				? Number(item.product_variants.price) * usdRate
				: Number(item.product_variants.price);
			return acc + finalUnitPrice * item.quantity;
		}, 0);

		return {
			updatedQuantity: quantity,
			cartItemFinalPrice: isEn
				? parseFloat((Number(variant.price) * quantity * usdRate).toFixed(2))
				: variant.price,
			subTotal: isEn ? subTotal.toFixed(2) : subTotal,
		};
	},

	async deleteItem(userId: number, variantId: string, locale: string) {
		const deletedItems = await db.cartItem.deleteMany({
			where: { variantId: variantId, cart: { userId: userId } },
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

		const isEn = locale == "en";
		const usdRate = await getVndToUsdRate();
		const subTotal = cart.items.reduce((acc, item) => {
			const finalUnitPrice = isEn
				? Number(item.product_variants.price) * item.quantity * usdRate
				: Number(item.product_variants.price);
			return acc + finalUnitPrice * item.quantity;
		}, 0);

		return { cartCount, variantId, subTotal: isEn ? subTotal.toFixed(2) : subTotal };
	},
};
