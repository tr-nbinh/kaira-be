import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { authMiddleware, handleCors } from "./middleware-handler/index";

export default async function middleware(req: NextRequest) {
	const corsResponse = handleCors(req);
	if (corsResponse && req.method === "OPTIONS") {
		return corsResponse;
	}

	const authResponse = await authMiddleware(req);
	const finalResponse = authResponse || NextResponse.next();

	if (corsResponse) {
		// Sao chép CORS headers từ corsResponse (nếu có) vào authResponse
		corsResponse.headers.forEach((value, key) => {
			finalResponse.headers.set(key, value);
		});
	}
	return finalResponse;
}

export const config = {
	matcher: ["/api/:path*"],
};
