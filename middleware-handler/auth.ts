import { verifyToken } from "@/lib/auth";
import { getApiI18nContext } from "@/lib/helpers/api-i18n-context";
import { NextRequest, NextResponse } from "next/server";

const PUBLIC_API_PATTERNS = [
	/^\/api\/banners$/,
	/^\/api\/categories$/,
	/^\/api\/testimonials$/,
	/^\/api\/menus$/,
	/^\/api\/brands$/,
	/^\/api\/attributes(\/.*|\?.*)?$/,
	/^\/api\/blogs(\/.*|\?.*)?$/,
	/^\/api\/exchange-rate(\/.*|\?.*)?$/,
	/^\/api\/products(\/.*|\?.*)?$/,
];
const PUBLIC_API_PREFIX = "/api/auth";

export async function authMiddleware(req: NextRequest) {
	const { t } = await getApiI18nContext(req);

	const pathname = req.nextUrl.pathname;
	const isPublicApiPath =
		PUBLIC_API_PATTERNS.some((pattern) => pattern.test(pathname)) || pathname.startsWith(PUBLIC_API_PREFIX);
	const token = req.headers.get("Authorization")?.split(" ")[1] || req.cookies.get("token")?.value;

	if (!isPublicApiPath) {
		if (!token) {
			return Response.json(
				{ success: false, message: t("auth.unauthorized"), code: "UNAUTHORIZED" },
				{ status: 401 },
			);
		}

		try {
			const payload = await verifyToken(token);
			req.headers.set("X-User-Id", payload!.id.toString());
			return NextResponse.next({
				request: { headers: req.headers },
			});
		} catch (error) {
			return NextResponse.json({ success: false, message: t("auth.invalidOrExpiredToken") }, { status: 401 });
		}
	}

	if (token) {
		try {
			const payload = await verifyToken(token);
			req.headers.set("X-User-Id", payload!.id.toString());
			return NextResponse.next({
				request: { headers: req.headers },
			});
		} catch (error) {
			return NextResponse.next();
		}
	}

	return null;
}
