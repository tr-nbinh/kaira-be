import { db } from "@/lib/db";
import { getLocaleFromRequest } from "@/lib/helpers/api-i18n-context";

export async function GET(req: Request) {
	try {
		console.log("[GET /api/menus] 1. Route entered");

		const locale = getLocaleFromRequest(req);
		console.log("[GET /api/menus] 2. Locale:", locale);

		console.log("[GET /api/menus] 3. Before Prisma");

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
					where: {
						languageCode: locale,
					},
					select: {
						name: true,
					},
				},
			},
		});

		console.log("[GET /api/menus] 4. After Prisma");

		const formattedMenus = menus.map((menu) => {
			const { translations, ...newMenu } = menu;

			return {
				...newMenu,
				name: translations[0]?.name,
			};
		});

		console.log("[GET /api/menus] 5. Response OK");

		return Response.json(formattedMenus, {
			status: 200,
		});
	} catch (err) {
		console.error("[GET /api/menus] ERROR:", err);

		return Response.json(
			{
				success: false,
				type: (err as any)?.constructor?.name,
				name: (err as any)?.name,
				message: (err as any)?.message,
				stack: (err as any)?.stack,
				error: err,
			},
			{
				status: 500,
			},
		);
	}
}
