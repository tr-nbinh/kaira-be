import { db } from "@/lib/db";
import { getApiI18nContext } from "@/lib/helpers/api-i18n-context";
import { generateOrderNumber } from "@/lib/helpers/generate-order-number.helper";
import { ApiError } from "@/lib/utils/api-error";
import { sendSuccess } from "@/lib/utils/api-response";
import { getAuthenticatedUserId } from "@/lib/utils/auth-util";
import { handleApiError } from "@/lib/utils/handleError";
import { PlaceOrderSchema } from "@/lib/validations/checkout.validation";
import { NextRequest, NextResponse } from "next/server";

const FREESHIP_THRESHOLD = 15000000; // Đơn hàng >= 500k được freeship

export async function POST(request: NextRequest) {
	try {
		const { t, locale } = await getApiI18nContext(request);
		const userId = getAuthenticatedUserId(request);
		if (!userId) {
			throw new ApiError(t("auth.unauthorized"), 401);
		}
		const body = await request.json();
		const validation = PlaceOrderSchema.parse(body);
		const { email, note, paymentMethod, shippingAddress } = validation;

		// 2. Chạy Database Transaction để đảm bảo tính toàn vẹn dữ liệu
		const result = await db.$transaction(async (tx) => {
			const cart = await tx.cart.findUnique({ where: { userId } });
			if (!cart) {
				throw new ApiError("Cart does not exist", 404);
			}
			// Bước 2.1: Lấy toàn bộ sản phẩm trong giỏ hàng và dữ liệu Variant từ DB
			const cartItems = await tx.cartItem.findMany({
				where: { cartId: cart.id },
				include: {
					product_variants: {
						include: {
							products: {
								include: {
									product_translations: { where: { language_code: locale } },
									variantImages: { where: { is_main: true } },
								},
							},
						},
					},
				},
			});
			if (!cartItems || cartItems.length === 0) {
				throw new Error("Giỏ hàng trống hoặc không tồn tại");
			}

			let subtotal = 0;
			let totalWeight = 0;
			const orderItemsData = [];

			// Bước 2.2: Duyệt qua giỏ hàng để tính toán tiền và trừ kho ảo
			for (const item of cartItems) {
				const variant = item.product_variants;
				if (!variant) throw new Error("Sản phẩm không tồn tại");

				const product = variant.products;
				if (!product) throw new Error("Không tìm thấy thông tin sản phẩm gốc");

				// BẢO MẬT: Kiểm tra số lượng tồn kho thực tế dưới DB, KHÔNG TIN FE
				if (variant.stock < item.quantity) {
					throw new Error(
						`Sản phẩm ${product.product_translations[0].name || "đã chọn"} không đủ số lượng trong kho`,
					);
				}

				// CHỐNG XUNG ĐỘT (Race Condition): Trừ kho trực tiếp bằng toán tử nguyên tử
				await tx.product_variants.update({
					where: { id: variant.id },
					data: { stock: { decrement: item.quantity } },
				});

				// Tính toán tổng tiền hàng và tổng khối lượng dựa trên số lượng chuẩn của DB
				subtotal += variant.price.toNumber() * item.quantity;
				totalWeight += 200 * item.quantity;

				const image = variant.products.variantImages.find((image) =>
					variant.option_value_ids.includes(image.attributeValueId),
				);
				// Chuẩn bị mảng dữ liệu để nạp vào bảng OrderItem
				orderItemsData.push({
					productId: variant.product_id,
					productName: variant.products.product_translations[0].name || "Sản phẩm",
					imageUrl: image?.url || "",
					sku: variant.sku,
					compare_at_price: variant.compare_at_price?.toNumber() || variant.price.toNumber(),
					price: variant.price.toNumber(),
					totalPrice: variant.price.toNumber() * item.quantity,
					quantity: item.quantity,
					variant: {
						connect: { id: variant.id },
					},
				});
			}

			// Bước 2.3: Tính phí vận chuyển tự động bằng `provinceCode`
			let shippingFee = 35000; // Phí ship mặc định nếu không tìm thấy vùng

			if (subtotal >= FREESHIP_THRESHOLD) {
				shippingFee = 0; // Đạt ngưỡng Freeship
			} else {
				// Tìm cấu hình vùng dựa theo provinceCode chuẩn
				const zone = await tx.shippingZone.findFirst({
					where: { provinceCodes: { has: shippingAddress.provinceCode } },
				});

				if (zone) {
					shippingFee = zone.baseFee;
					// Tính thêm phí vượt cân nếu tổng khối lượng lớn hơn 1kg (1000g)
					if (totalWeight > 1000) {
						const excessWeight = totalWeight - 1000;
						const weightSteps = Math.ceil(excessWeight / 500);
						shippingFee += weightSteps * zone.stepFee;
					}
				}
			}

			const totalAmount = subtotal + shippingFee;

			// Bước 2.4: Thực hiện Nested Writes (Tạo Order, OrderAddress, OrderItem cùng 1 lúc)
			// Nhờ cấu trúc Schema mới (OrderAddress lưu orderId), Prisma sẽ tự động map ID chính xác
			const createdOrder = await tx.order.create({
				data: {
					userId: userId,
					orderNumber: generateOrderNumber(),
					email,
					status: "pending",
					note: note || null,
					paymentMethod: paymentMethod,
					paymentStatus: "pending",
					subtotal: subtotal,
					discount: 0,
					shippingFee: shippingFee,
					totalAmount: totalAmount,
					checkout_id: crypto.randomUUID(), // Đồng bộ cartId sang làm mã phiên checkout unique

					// Khởi tạo địa chỉ đính kèm vào Order (Quan hệ 1-1)
					orderAddress: {
						create: {
							fullName: shippingAddress.fullName,
							phone: shippingAddress.phone,
							provinceCode: shippingAddress.provinceCode,
							provinceName: shippingAddress.provinceName,
							wardCode: shippingAddress.wardCode,
							wardName: shippingAddress.wardName,
							addressLine: shippingAddress.addressLine,
							addressExtra: shippingAddress.addressExtra || null,
						},
					},

					// Khởi tạo toàn bộ danh sách chi tiết mặt hàng của Đơn hàng (Quan hệ 1-n)
					items: {
						create: orderItemsData,
					},
				},
				include: {
					orderAddress: true,
					items: true,
				},
			});

			// Bước 2.5: Giải phóng (Xóa sạch) giỏ hàng của User sau khi đã lên đơn hoàn tất
			await tx.cartItem.deleteMany({
				where: { cartId: cart.id },
			});

			return createdOrder;
		});

		// 3. Phân luồng xử lý và trả về phản hồi theo Phương thức thanh toán
		if (paymentMethod === "cod") {
			return sendSuccess({ orderId: result.id, cartCount: 0 });
		}

		if (paymentMethod === "vnpay") {
			// Gọi logic tích hợp / tạo link thanh toán VNPAY bằng mã đơn `result.id` và số tiền `result.totalAmount`
			const vnpayUrl = `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?orderId=${result.id}&amount=${result.totalAmount * 100}...`;
			return NextResponse.json({
				success: true,
				paymentType: "vnpay",
				redirectUrl: vnpayUrl,
			});
		}

		if (paymentMethod === "stripe") {
			// Khởi tạo Stripe Checkout Session URL ở đây
			const stripeUrl = `https://checkout.stripe.com/pay/...`;
			return NextResponse.json({
				success: true,
				paymentType: "stripe",
				redirectUrl: stripeUrl,
			});
		}

		// Trả về fallback mặc định nếu có phương thức thanh toán khác chưa map hết
		return NextResponse.json({ success: true, orderId: result.id });
	} catch (error: any) {
		return handleApiError(error);
	}
}
