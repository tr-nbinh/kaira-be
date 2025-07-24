// middleware-handlers/authHandler.ts
import { verifyToken } from "@/lib/auth";
import { getApiI18nContext } from "@/lib/helpers/api-i18n-context";
import { NextRequest, NextResponse } from "next/server";

export interface AuthenticatedRequest extends NextRequest {
	user?: { id: number; [key: string]: any } | null; // Mở rộng thêm các thuộc tính user nếu cần
}

const PUBLIC_API_PATTERNS = [
	/^\/api\/banners$/,
	/^\/api\/categories$/,
	/^\/api\/products$/, // Khớp chính xác /api/products
	/^\/api\/products\/[^\/]+$/, // Khớp /api/products/BẤT_KỲ_GÌ (ví dụ: /api/products/16, /api/products/abc)
	/^\/api\/testimonials$/,
	/^\/api\/menus$/,
	/^\/api\/colors$/,
	/^\/api\/sizes$/,
	/^\/api\/brands$/,
];
const PUBLIC_API_PREFIX = "/api/auth";

export async function authMiddleware(req: AuthenticatedRequest): Promise<NextResponse | null> {
	const { t } = await getApiI18nContext(req);

	const pathname = req.nextUrl.pathname;
    const isPublicApiPath = PUBLIC_API_PATTERNS.some(pattern => pattern.test(pathname)) || pathname.startsWith(PUBLIC_API_PREFIX);
	if (isPublicApiPath) {
		return null; // Trả về null để chỉ ra rằng không có lỗi và request có thể tiếp tục
	}

	const token = req.headers.get("Authorization")?.split(" ")[1] || req.cookies.get("token")?.value;
	if (!token) {
		return NextResponse.json({ message: t("auth.unauthorized") }, { status: 401 });
	}

	try {
		const decodedUser = await verifyToken(token);
		if (!decodedUser) throw new Error(t("auth.access.token_invalid"));

		req.user = decodedUser;
		return null;
	} catch (error) {
		return NextResponse.json({ message: t("auth.invalidOrExpiredToken") }, { status: 401 });
	}
}
