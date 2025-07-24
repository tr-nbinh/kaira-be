import { db } from "@/lib/db";
import { getLocaleFromRequest } from "@/lib/helpers/api-i18n-context";
import { handleApiError } from "@/lib/utils/handleError";

export async function GET(req: Request) {
    console.log("--- API Route Handler for /api/banners IS BEING EXECUTED ---"); // Thêm log này
	try {
		const locale = getLocaleFromRequest(req);
		const banners = await db.banner.findMany({
			orderBy: {
				order: "asc",
			},
			select: {
				id: true,
				altText: true,
				imageUrl: true,
				mobileImageUrl: true,
				videoUrl: true,
				translations: {
					where: { languageCode: locale },
					select: {
						headline: true,
						subHeadline: true,
					},
				},
			},
		});

		const formattedBanners = banners.map((banner) => {
			const { translations, ...newBanner } = banner;
			return { ...newBanner, ...translations[0] };
		});

		return Response.json(formattedBanners, { status: 200 });
	} catch (err) {
		return handleApiError(err);
	}
}
