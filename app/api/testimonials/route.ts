import { db } from "@/lib/db";
import { getLocaleFromRequest } from "@/lib/helpers/api-i18n-context";
import { handleApiError } from "@/lib/utils/handleError";

export async function GET(req: Request) {
	try {
		const locale = getLocaleFromRequest(req);
		const testimonials = await db.quote.findMany({
			select: {
				id: true,
				authorName: true,
				translations: {
					where: { languageCode: locale },
					select: {
						content: true,
					},
				},
			},
		});

		const formattedTestimonials = testimonials.map((item) => {
			const { translations, ...testimonial } = item;
			return { ...testimonial, ...translations[0] };
		});
		return Response.json(formattedTestimonials, { status: 200 });
	} catch (err) {
		return handleApiError(err);
	}
}
