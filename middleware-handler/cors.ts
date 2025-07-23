// middleware-handlers/corsHandler.ts
import { NextRequest, NextResponse } from "next/server";

const allowedOrigins = process.env.NODE_ENV === "production" ? ["http://localhost:4200"] : ["http://localhost:4200"]; // Domain của Angular dev server

const commonCorsHeaders = {
	"Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type, Authorization",
	"Access-Control-Allow-Credentials": "true",
	"Access-Control-Max-Age": "86400", // 24 hours
};

export function handleCors(req: NextRequest): NextResponse | null {
	const origin = req.headers.get("Origin");

	// Nếu không phải API request hoặc không có Origin, bỏ qua CORS
	if (!req.nextUrl.pathname.startsWith("/api") || !origin) {
		return null; // Trả về null để chỉ ra rằng không có hành động CORS cụ thể nào
	}

	const corsHeaders: { [key: string]: string } = { ...commonCorsHeaders };

	// Thiết lập Access-Control-Allow-Origin động
	if (allowedOrigins.includes(origin)) {
		corsHeaders["Access-Control-Allow-Origin"] = origin;
	} else {
		// Để an toàn, nếu origin không nằm trong danh sách cho phép, có thể không set Origin
		// hoặc set một Origin mặc định an toàn.
		// Trong production, bạn nên cẩn thận với '*'
		corsHeaders["Access-Control-Allow-Origin"] = "null"; // hoặc một giá trị an toàn khác
	}

	// Xử lý OPTIONS preflight request
	if (req.method === "OPTIONS") {
		return NextResponse.json({}, { headers: corsHeaders });
	}

	// Nếu là request thông thường, chỉ thêm headers và cho phép đi tiếp
	const response = NextResponse.next();
	Object.entries(corsHeaders).forEach(([key, value]) => {
		response.headers.set(key, value);
	});

	return response;
}
