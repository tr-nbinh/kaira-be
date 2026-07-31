import { cookies } from "next/headers";

export async function setAuthCookies(accessToken: string, refreshToken: string) {
	const cookieStore = await cookies();
	const isProd = process.env.NODE_ENV === "production";

	cookieStore.set("accessToken", accessToken, {
		httpOnly: true,
		secure: isProd, // chỉ HTTPS khi production
		sameSite: isProd ? "none" : "lax",
		path: "/",
		maxAge: 60 * 15, // 15 phút
	});

	cookieStore.set("refreshToken", refreshToken, {
		httpOnly: true,
		secure: isProd,
		sameSite: isProd ? "none" : "lax",
		path: "/",
		maxAge: 60 * 60 * 24 * 7, // 7 ngày
	});
}

export async function clearAuthCookies() {
	const cookieStore = await cookies();
	const isProd = process.env.NODE_ENV === "production";

	const cookieOptions = {
		value: "",
		httpOnly: true,
		secure: isProd,
		sameSite: isProd ? ("none" as const) : ("lax" as const),
		path: "/",
		maxAge: 0,
	};

	// 🔥 Xoá bằng cách set expires về quá khứ
	cookieStore.set({
		...cookieOptions,
		name: "accessToken",
		maxAge: 0,
	});

	cookieStore.set({
		...cookieOptions,
		name: "refreshToken",
	});
}
