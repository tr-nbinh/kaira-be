import { db } from "@/lib/db";
import { getLocaleFromRequest } from "@/lib/helpers/api-i18n-context";
import { handleApiError } from "@/lib/utils/handleError";

export async function GET(req: Request) {
	try {
		const locale = getLocaleFromRequest(req);
		const sizes = await db.size.findMany({
			orderBy: {
				displayOrder: "asc",
			},
			select: {
				id: true,
				translations: {
					where: { languageCode: locale },
					select: {
						name: true,
					},
				},
			},
		});

		const formattedSizes = sizes.map((size) => {
			const { translations, ...newSize } = size;
			return { ...newSize, ...translations[0] };
		});
		return Response.json(formattedSizes, { status: 200 });
	} catch (err) {
		return handleApiError(err);
	}
}
