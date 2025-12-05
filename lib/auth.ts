import bcrypt from "bcryptjs";
import { JWTPayload, jwtVerify, SignJWT, type JWTVerifyResult } from "jose";
import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";

export interface DecodedToken {
	id: number;
	username: string;
	email: string;
	iat: number;
	exp: number;
}

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
	const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
	return hashedPassword;
}

export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
	return await bcrypt.compare(password, hashedPassword);
}

export function generateRefreshToken(): string {
	return uuidv4(); // Generates a UUID string (e.g., '1b9d67b2-ad3b-4876-9c47-df90c6a3c6d3')
}

export async function hashRefreshToken(refreshToken: string): Promise<string> {
	return await bcrypt.hash(refreshToken, SALT_ROUNDS);
}

export async function compareRefreshToken(refreshToken: string, hashedRefreshToken: string): Promise<boolean> {
	return await bcrypt.compare(refreshToken, hashedRefreshToken);
}

export async function generateAccessToken(payload: JWTPayload) {
	const jwtSecret = process.env.JWT_SECRET;
	if (!jwtSecret) {
		throw new Error("JWT_SECRET is not defined in environment variables.");
	}
	const secretKey = new TextEncoder().encode(jwtSecret);

	// Sign the token with the secret and set an expiration time (e.g., 1 hour)
	return await new SignJWT(payload)
		.setProtectedHeader({ alg: "HS256" }) // Thuật toán ký, HS256 là phổ biến cho HMAC
		.setIssuedAt() // Đặt thời gian phát hành (iat)
		.setExpirationTime("15m") // Đặt thời gian hết hạn (exp) là 15 phút
		.sign(secretKey); // Ký token bằng secret key;
}

export async function verifyToken(token: string): Promise<DecodedToken | null> {
	const jwtSecret = process.env.JWT_SECRET;

	if (!jwtSecret) {
		console.error("JWT_SECRET is not defined for token verification.");
		return null;
	}

	try {
		const secretKey = new TextEncoder().encode(jwtSecret);
		const { payload } = (await jwtVerify(token, secretKey)) as JWTVerifyResult<DecodedToken>;
		return payload;
	} catch (error) {
		console.error("Lỗi xác thực token:", error);
		return null;
	}
}

export const setRefreshTokenCookie = async (token: string, rememberMe: boolean) => {
	const REFRESH_TOKEN_EXPIRATION_DAYS = 7; // Hoặc lấy từ biến môi trường
	const MAX_AGE = rememberMe ? REFRESH_TOKEN_EXPIRATION_DAYS * 24 * 60 * 60 : undefined; // 0 để cookie biến mất khi đóng trình duyệt nếu không remember
	const cookieStore = await cookies();
	cookieStore.set({
		name: "refreshToken",
		value: token,
		httpOnly: true,
		secure: false, // bắt buộc khi dùng SameSite=None hoặc trong production
		path: "/",
		sameSite: "lax", // hoặc 'strict' hoặc 'none' nếu dùng cross-site
		maxAge: MAX_AGE,
	});
};

export const clearRefreshTokenCookie = async () => {
	const cookieStore = await cookies();
	cookieStore.set({
		name: "refreshToken",
		value: "",
		httpOnly: true,
		secure: false, // bắt buộc khi dùng SameSite=None hoặc trong production
		path: "/",
		sameSite: "lax", // hoặc 'strict' hoặc 'none' nếu dùng cross-site
		maxAge: 0,
	});
};

export const generateToken = (): string => {
	return crypto.randomUUID();
};
