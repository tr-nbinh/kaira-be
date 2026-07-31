import { db } from "@/lib/db";
import { getApiI18nContext } from "@/lib/helpers/api-i18n-context";
import { ApiError } from "@/lib/utils/api-error";
import { getAuthenticatedUserId } from "@/lib/utils/auth-util";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id: orderId } = await params;
		const { t, locale } = await getApiI18nContext(request);
		const userId = getAuthenticatedUserId(request);
		if (!userId) {
			throw new ApiError(t("auth.unauthorized"), 401);
		}
		// Query chi tiết đơn hàng cùng thông tin Address & Items
		const order = await db.order.findUnique({
			where: { id: orderId },
			include: {
				orderAddress: true,
				items: true,
			},
		});

		// Kiểm tra đơn hàng tồn tại & thuộc về user hiện tại
		if (!order || order.userId !== userId) {
			return NextResponse.json(
				{
					success: false,
					statusCode: 404,
					message: "Không tìm thấy thông tin đơn hàng hoặc bạn không có quyền truy cập.",
				},
				{ status: 404 },
			);
		}

		return NextResponse.json(
			{
				success: true,
				statusCode: 200,
				message: "Lấy chi tiết đơn hàng thành công.",
				data: order,
			},
			{ status: 200 },
		);
	} catch (error) {
		console.error("Error fetching order detail:", error);
		return NextResponse.json(
			{
				success: false,
				statusCode: 500,
				message: "Lỗi server nội bộ khi lấy chi tiết đơn hàng.",
			},
			{ status: 500 },
		);
	}
}
