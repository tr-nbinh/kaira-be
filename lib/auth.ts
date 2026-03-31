import bcrypt from "bcryptjs";
import { JWTPayload, jwtVerify, SignJWT, type JWTVerifyResult } from "jose";
import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";
import { ApiError } from "./utils/api-error";

export interface DecodedToken {
	id: number;
	username: string;
	email: string;
}

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
	const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
	return hashedPassword;
}

export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
	return await bcrypt.compare(password, hashedPassword);
}

export async function hashRefreshToken(refreshToken: string): Promise<string> {
	const msgUint8 = new TextEncoder().encode(refreshToken);
	const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
	return hashHex;
}

export async function generateAccessToken(payload: JWTPayload) {
	const jwtSecret = process.env.JWT_SECRET;
	if (!jwtSecret) {
		throw new ApiError("JWT_SECRET is not defined in environment variables.", 404);
	}
	const secretKey = new TextEncoder().encode(jwtSecret);

	// Sign the token with the secret and set an expiration time (e.g., 1 hour)
	return await new SignJWT(payload)
		.setProtectedHeader({ alg: "HS256" }) // Thuật toán ký, HS256 là phổ biến cho HMAC
		.setIssuedAt() // Đặt thời gian phát hành (iat)
		.setExpirationTime("15m") // Đặt thời gian hết hạn (exp) là 15 phút
		.sign(secretKey); // Ký token bằng secret key;
}

export async function verifyToken(token: string): Promise<DecodedToken> {
	const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
	const { payload } = (await jwtVerify(token, secretKey)) as JWTVerifyResult<DecodedToken>;
	return payload;
}

export const setRefreshTokenCookie = async (token: string, rememberMe: boolean) => {
	const REFRESH_TOKEN_EXPIRATION_DAYS = 7;
	const MAX_AGE = rememberMe ? REFRESH_TOKEN_EXPIRATION_DAYS * 24 * 60 * 60 : undefined; // 0 để cookie biến mất khi đóng trình duyệt nếu không remember
	const cookieStore = await cookies();
	cookieStore.set({
		name: "refresh_token",
		value: token,
		httpOnly: true,
		// secure: process.env.NODE_ENV == "production",
		secure: false,
		path: "/",
		sameSite: "lax", // hoặc 'strict' hoặc 'none' nếu dùng cross-site
		maxAge: MAX_AGE,
	});
};
