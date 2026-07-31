import { db } from "@/lib/db";
import { getAuthenticatedUserId } from "@/lib/utils/auth-util";
import { NextRequest, NextResponse } from "next/server";

// Cấu hình hằng số cấu hình Freeship
const FREESHIP_THRESHOLD = 15000000; // Đơn hàng >= 500k được freeship

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const { provinceCode } = body;

		if (!provinceCode) {
			return NextResponse.json({ message: "Dữ liệu không hợp lệ" }, { status: 400 });
		}

		const userId = getAuthenticatedUserId(req);

		const cart = await db.cart.findUnique({
			where: { userId },
		});
		if (!cart) {
			return NextResponse.json({ message: "Giỏ hàng trống" }, { status: 400 });
		}
		// 1. Truy vấn toàn bộ danh sách item trong giỏ hàng TRONG DATABASE bằng cartId
		// Đồng thời JOIN sang bảng ProductVariant để lấy Giá và Cân nặng thật
		const dbCartItems = await db.cartItem.findMany({
			where: { cartId: cart.id },
			include: {
				product_variants: true, // Đảm bảo mối quan hệ (relationship) đã được định nghĩa trong schema
			},
		});

		if (!dbCartItems || dbCartItems.length === 0) {
			return NextResponse.json({ message: "Giỏ hàng trống" }, { status: 400 });
		}

		let subtotal = 0;
		let totalWeight = 0;

		for (const item of dbCartItems) {
			const variant = item.product_variants;

			if (variant) {
				// Lấy số lượng (quantity) được lưu an toàn trong DB, KHÔNG TIN FE
				subtotal += variant.price.toNumber() * item.quantity;
				totalWeight += 200 * item.quantity; // variant không có weight mặc định là 200g
			}
		}

		// 2. Kiểm tra điều kiện chính sách FREESHIP
		if (subtotal >= FREESHIP_THRESHOLD) {
			return NextResponse.json({ fee: 0, reason: "Đủ điều kiện Freeship" });
		}

		// 3. Tìm cấu hình Phí Ship (Zone) theo tỉnh thành khách hàng chọn
		const zone = await db.shippingZone.findFirst({
			where: {
				provinceCodes: {
					has: provinceCode, // Tìm xem tỉnh này nằm trong mảng provinces nào
				},
			},
		});

		// Nếu không tìm thấy vùng cấu hình, lấy mức phí mặc định liên tỉnh
		const baseFee = zone ? zone.baseFee : 35000;
		const stepFee = zone ? zone.stepFee : 5000;

		// 4. Tính toán phí dựa trên khối lượng (Áp dụng cho đơn > 1000g)
		let finalFee = baseFee;

		if (totalWeight > 1000) {
			const excessWeight = totalWeight - 1000;
			const weightSteps = Math.ceil(excessWeight / 500); // Mỗi 500g tiếp theo
			finalFee += weightSteps * stepFee;
		}

		return NextResponse.json({
			fee: finalFee,
			totalWeight,
			subtotal,
		});
	} catch (error) {
		console.error("Shipping calculation error:", error);
		return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
	}
}
