import { cookies } from "next/headers";

interface SetCookieOptions {
	name: string;
	value: string;
	httpOnly?: boolean;
	secure?: boolean;
	path?: string;
	sameSite?: "lax" | "strict" | "none";
	maxAge?: number; // tính bằng giây
	expires?: Date;
}

export const setCookie = async (options: SetCookieOptions) => {
	const cookieStore = await cookies();

	// Xóa thuộc tính expires/maxAge nếu undefined để tránh cookie bị giữ giá trị cũ
	const { name, value, httpOnly, secure, path, sameSite, maxAge, expires } = options;

	const cookieData: SetCookieOptions = {
		name,
		value,
		httpOnly: httpOnly ?? false,
		secure: secure ?? false,
		path: path ?? "/",
		sameSite: sameSite ?? "lax",
	};

	if (typeof maxAge !== "undefined") cookieData.maxAge = maxAge;
	if (typeof expires !== "undefined") cookieData.expires = expires;

	cookieStore.set(cookieData);
};
