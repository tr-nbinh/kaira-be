import { db } from "@/lib/db";
import { sendSuccess } from "@/lib/utils/api-response";
import { handleApiError } from "@/lib/utils/handleError";

export async function GET() {
	try {
		const brands = await db.brand.findMany({
			select: {
				id: true,
				name: true,
			},
		});

		return sendSuccess(brands);
	} catch (err) {
		return handleApiError(err);
	}
}
