import {
	clearRefreshTokenCookie,
	compareRefreshToken,
	generateAccessToken,
	generateRefreshToken,
	hashRefreshToken,
	setRefreshTokenCookie,
} from "@/lib/auth";
import { db } from "@/lib/db";
import { response } from "@/lib/helpers/api-helpers";
import { getApiI18nContext } from "@/lib/helpers/api-i18n-context";
import { handleApiError } from "@/lib/utils/handleError";
import { setCookie } from "@/lib/utils/setCookie";
import { cookies } from "next/headers";

export async function POST(req: Request) {
	try {
		const { t } = await getApiI18nContext(req);

		const cookieStore = await cookies();
		const refreshTokenCookie = cookieStore.get("refreshToken");
		const rememberMeCookie = cookieStore.get("rememberMe");

		if (!refreshTokenCookie || !refreshTokenCookie.value) {
			return response({ message: t("auth.refresh.token_not_found") }, 401);
		}
		const refreshToken = refreshTokenCookie.value;
		const rememberMe = rememberMeCookie?.value === "1";
		// Find the user by comparing the provided refresh token with the hashed one in the database
		// Ensure to also check if the refresh token has expired
		const users = await db.user.findMany({
			where: { refreshTokenHash: { not: null }, refreshTokenExpiresAt: { gt: new Date() } },
		});

		let user = null;
		// Iterate through users to find a match as the hash cannot be directly queried
		// In a high-traffic system, you might index refresh_token_hash or use a different storage for them
		for (const row of users) {
			const isMatch = await compareRefreshToken(refreshToken, row.refreshTokenHash || "");
			if (isMatch) {
				user = row;
				break;
			}
		}

		if (!user) {
			// If no matching user found or token expired/invalid
			return response({ message: t("auth.refresh.invalid_token") }, 401);
		}

		// Generate new Access Token
		const newAccessTokenPayload = {
			id: user.id,
			username: user.username,
			email: user.email,
		};
		const newAccessToken = await generateAccessToken(newAccessTokenPayload);

		const newRefreshToken = generateRefreshToken();
		const newHashedRefreshToken = await hashRefreshToken(newRefreshToken);
		const newRefreshTokenExpiresAt = new Date();
		newRefreshTokenExpiresAt.setDate(newRefreshTokenExpiresAt.getDate() + 7); // New refresh token valid for 7 days

		await db.user.update({
			where: { id: user.id },
			data: {
				refreshTokenHash: newHashedRefreshToken,
				refreshTokenExpiresAt: newRefreshTokenExpiresAt,
			},
		});

		await setCookie({
			name: "rememberMe",
			value: rememberMe ? "1" : "0",
			maxAge: rememberMe ? 7 * 24 * 60 * 60 : undefined,
		});
		await setRefreshTokenCookie(newRefreshToken, rememberMe);

		return response({ message: t("auth.refresh.success"), data: newAccessToken }, 200);
	} catch (error) {
		clearRefreshTokenCookie();
		return handleApiError(error);
	}
}
