import { db } from "@/lib/db";
import { getLocaleFromRequest } from "@/lib/helpers/api-i18n-context";
import { handleApiError } from "@/lib/utils/handleError";

export async function GET(req: Request) {
	try {
		const locale = getLocaleFromRequest(req);
		const categories = await db.category.findMany({
			orderBy: {
				order: "asc",
			},
			select: {
				id: true,
				parentCategoryId: true,
				imageUrl: true,
				translations: {
					where: { languageCode: locale },
					select: {
						name: true,
					},
				},
			},
		});

		const formattedCategories = categories.map((cat) => {
			const { translations, ...newCategory } = cat;
			return { ...newCategory, ...translations[0] };
		});
		return Response.json(formattedCategories, { status: 200 });
	} catch (err) {
		return handleApiError(err);
	}
}
