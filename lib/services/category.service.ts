import { db } from "../db";
import { flattenTranslation } from "../helpers/flatten-translation.helper";

export const CategoryService = {
	async getCategories(locale: string) {
		const categories = await db.category.findMany({
			where: { is_active: true },
			select: {
				id: true,
				image_public_id: true,
				imageUrl: true,
				sort_order: true,
				translations: {
					where: { languageCode: locale },
					select: {
						name: true,
						slug: true,
					},
				},
			},
			orderBy: { sort_order: "asc" },
		});
		return flattenTranslation(categories, locale);
	},
};
