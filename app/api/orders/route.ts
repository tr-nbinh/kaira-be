import { db } from "@/lib/db";
import { getApiI18nContext } from "@/lib/helpers/api-i18n-context";
import { ApiError } from "@/lib/utils/api-error";
import { getAuthenticatedUserId } from "@/lib/utils/auth-util";
import { handleApiError } from "@/lib/utils/handleError";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	try {
		const { t, locale } = await getApiI18nContext(request);
		const userId = getAuthenticatedUserId(request);
		if (!userId) {
			throw new ApiError(t("auth.unauthorized"), 401);
		}

		// 2. Lấy Query Parameters từ URL
		const { searchParams } = new URL(request.url);
		const page = parseInt(searchParams.get("page") || "1", 10);
		const limit = parseInt(searchParams.get("limit") || "10", 10);
		const status = searchParams.get("status");

		const skip = (page - 1) * limit;

		// 3. Xây dựng điều kiện lọc (Where condition)
		const whereCondition: any = { userId };
		if (status) {
			whereCondition.status = status;
		}

		// 4. Query dữ liệu từ Database bằng Prisma
		const [orders, totalItems] = await Promise.all([
			db.order.findMany({
				where: whereCondition,
				orderBy: { createdAt: "desc" },
				skip,
				take: limit,
				select: {
					id: true,
					status: true,
					paymentStatus: true,
					paymentMethod: true,
					totalAmount: true,
					createdAt: true,
					items: {
						take: 1, // Chỉ lấy item đầu tiên để hiển thị thumbnail trên danh sách
						select: {
							productName: true,
							imageUrl: true,
							quantity: true,
							price: true,
							totalPrice: true,
						},
					},
					_count: {
						select: { items: true }, // Đếm tổng số món hàng
					},
				},
			}),
			db.order.count({ where: whereCondition }),
		]);

		// 5. Format lại kết quả trả về khớp 100% với Interface của Angular
		const formattedData = orders.map((order) => {
			const firstItem = order.items[0] || null;
			return {
				id: order.id,
				status: order.status,
				paymentStatus: order.paymentStatus,
				paymentMethod: order.paymentMethod,
				totalAmount: order.totalAmount,
				totalItems: order._count.items,
				createdAt: order.createdAt,
				firstItem: firstItem ? firstItem : null,
			};
		});

		const totalPages = Math.ceil(totalItems / limit);

		return NextResponse.json(
			{
				success: true,
				statusCode: 200,
				message: "Lấy danh sách đơn hàng thành công.",
				data: formattedData,
				pagination: {
					page,
					limit,
					totalItems,
					totalPages,
				},
			},
			{ status: 200 },
		);
	} catch (error) {
		return handleApiError(error);
	}
}
