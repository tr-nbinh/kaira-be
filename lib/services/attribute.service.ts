import { db } from "../db";

export const attributeService = {
	async getColors(locale: string) {
		const color = await db.attributes.findFirst({
			where: { slug: "color" },
			select: {
				attribute_values: {
					select: {
						id: true,
						value_code: true,
						attribute_value_translations: {
							where: { language_code: locale },
							select: {
								name: true,
							},
						},
					},
				},
			},
		});
		if (!color) return [];

		const result = color.attribute_values.map((attr) => {
			const { attribute_value_translations, ...rest } = attr;
			return { ...rest, name: attribute_value_translations[0].name };
		});

		return result;
	},
};
