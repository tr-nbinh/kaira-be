import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { handleCors, authMiddleware } from "./middleware-handler/index";
import { AuthenticatedRequest } from "./middleware-handler/auth";

export default async function middleware(req: NextRequest) {
	const authenticatedReq = req as AuthenticatedRequest;

	// GIAI ĐOẠN 1: Xử lý CORS
	const corsResponse = handleCors(authenticatedReq);
	if (corsResponse) {
		if (authenticatedReq.method === "OPTIONS") {
			return corsResponse;
		}
	}

	// GIAI ĐOẠN 2: Xử lý Xác thực (chỉ chạy nếu không phải OPTIONS preflight)
	// authMiddleware sẽ trả về NextResponse (lỗi) hoặc null (thành công)
	const authResponse = await authMiddleware(authenticatedReq);
	if (authResponse) {
		// Sao chép CORS headers từ corsResponse (nếu có) vào authResponse
		if (corsResponse) {
			corsResponse.headers.forEach((value, key) => {
				authResponse.headers.set(key, value);
			});
		}
		return authResponse; // Trả về phản hồi lỗi từ xác thực
	}
	// Nếu xác thực thành công, request.user đã được gán bởi authMiddleware.
	// Tiếp tục tạo response mặc định và thêm CORS headers nếu có.
	const response = NextResponse.next();
	// Sao chép CORS headers vào response cuối cùng nếu corsResponse tồn tại
	if (corsResponse) {
		corsResponse.headers.forEach((value, key) => {
			response.headers.set(key, value);
		});
	}

	// Gắn userId vào response headers (tùy chọn)
	// Đây là một cách để truyền thông tin, nhưng truyền trực tiếp qua req.user là tốt hơn cho backend APIs.
	// Nếu bạn chỉ cần user ID ở frontend sau khi request hoàn tất, cách này OK.
	if (authenticatedReq.user?.id) {
		response.headers.set("X-User-Id", authenticatedReq.user.id.toString());
	}

	// Trả về response đã được xử lý CORS và (nếu cần) thêm user ID vào header
	return response;
}

// Cấu hình Matcher để áp dụng middleware cho TẤT CẢ các API routes
export const config = {
	matcher: ["/api/:path*"],
    runtime: 'nodejs'
};
