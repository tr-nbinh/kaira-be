import { db } from "@/lib/db";
import { handleApiError } from "@/lib/utils/handleError";

export async function GET(req: Request, { params }: { params: { sessionId: string } }) {
	try {
		const session = await db.checkoutSession.findUnique({
			where: { sessionId: params.sessionId },
			include: {
				cart: {
					include: { items: true },
				},
			},
		});

		if (!session) {
			return Response.json({ message: "Không tìm thấy phiên thanh toán" }, { status: 404 });
		}

		return Response.json(session);
	} catch (err) {
        return handleApiError(err);
    }
}
