import { db } from "@/lib/db";
import { sendSuccess } from "@/lib/utils/api-response";
import { handleApiError } from "@/lib/utils/handleError";

export async function POST(req: Request) {
	try {
		const body = await req.json();

		const images = await db.productImage.createMany({
			data: body,
		});
		return sendSuccess(images);
	} catch (error) {
		return handleApiError(error);
	}
}
