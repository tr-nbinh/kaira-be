import { db } from "@/lib/db";
import { response } from "@/lib/helpers/api-helpers";
import { getAuthenticatedUserId } from "@/lib/utils/auth-util";
import { handleApiError } from "@/lib/utils/handleError";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const userId = getAuthenticatedUserId(req);
		if (!userId) {
			return Response.json({ message: "UserId is invalid" }, { status: 400 });
		}

		const { id } = await params;
		const orderId = parseInt(id);
		if (!orderId) {
			return Response.json({ message: "order id không hợp lệ" }, { status: 400 });
		}

		const order = await db.order.findUnique({ where: { userId, id: orderId } });
		if (!order) {
			return response({ message: "Order not found" }, 404);
		}

		return response({ data: order, message: "" });
	} catch (error) {
		handleApiError(error);
	}
}
