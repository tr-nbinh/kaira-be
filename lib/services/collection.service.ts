import { db } from "../db";

export const CollectionService = {
	async getCollections(locale: string) {
		const collections = await db.collection.findMany({
			select: {
				id: true,
				image: true,
				featured: true,
				overlayClass: true,

				collectionTranslations: {
					where: { languageCode: locale },
					select: {
						name: true,
						slug: true,
					},
				},
			},
		});

		const formatted = collections.map((c) => {
			const { collectionTranslations: translations, ...rest } = c;
			return {
				...rest,
				name: translations[0].name || "",
				slug: translations[0].slug || "",
			};
		});

		return formatted;
	},
};
