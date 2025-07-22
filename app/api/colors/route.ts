import { db } from "@/lib/db";
import { getLocaleFromRequest } from "@/lib/helpers/api-i18n-context";
import { handleApiError } from "@/lib/utils/handleError";

interface ColorCreation {
	hexCode: string;
	translations: { languageCode: string; name: string }[];
}

export async function GET(req: Request) {
	try {
		const locale = getLocaleFromRequest(req);
		const colors = await db.color.findMany({
			select: {
				id: true,
                hexCode: true,
				translations: {
					where: { languageCode: locale },
					select: {
						name: true,
					},
				},
			},
		});

		const formattedColor = colors.map((color) => {
			const { translations, ...newColor } = color;
			return { ...newColor, ...translations[0] };
		});
		return Response.json(formattedColor, { status: 200 });
	} catch (err) {
		return handleApiError(err);
	}
}

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const { hexCode, translations } = body;

		const result = db.$transaction(async (tx: any) => {
			const color = await tx.colors.create({
				data: {
					hex_code: hexCode,
				},
			});

			const translationsData = translations.map((t: { languageCode: string; name: string }) => ({
				color_id: color.color_id,
				language_code: t.languageCode,
				name: t.name,
			}));

			const translation = await tx.color_translations.createMany({
				data: translationsData,
			});

			return color;
		});

		return Response.json(result, { status: 201 });
	} catch (err) {
		return handleApiError(err);
	}
}
