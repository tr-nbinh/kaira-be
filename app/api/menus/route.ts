import { db } from "@/lib/db";
import { getLocaleFromRequest } from "@/lib/helpers/api-i18n-context";
import { handleApiError } from "@/lib/utils/handleError";
import { Menu } from "@prisma/client";

export async function GET(req: Request) {
	try {
		const locale = getLocaleFromRequest(req);
		const menus = await db.menu.findMany({
			orderBy: {
				order: "asc",
			},
			select: {
				id: true,
				icon: true,
				path: true,
				order: true,
				parentId: true,
				translations: {
					where: { languageCode: locale },
					select: {
						name: true,
					},
				},
			},
		});

		const formattedMenus = menus.map((menu) => {
			const { translations, ...newMenu } = menu;
			return { ...newMenu, name: translations[0]?.name };
		});

		return Response.json(formattedMenus, { status: 200 });
	} catch (err) {
		return handleApiError(err);
	}
}
