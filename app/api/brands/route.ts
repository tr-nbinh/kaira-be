import { db } from "@/lib/db";
import { handleApiError } from "@/lib/utils/handleError";

export async function GET() {
	try {
		const brands = await db.brand.findMany({
			select: {
				id: true,
				name: true,
			},
		});

		return Response.json(brands, { status: 200 });
	} catch (err) {
		return handleApiError(err);
	}
}
