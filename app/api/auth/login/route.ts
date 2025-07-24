import {
	comparePassword as LoginComparePassword,
	generateAccessToken as LoginGenerateAccessToken,
	generateRefreshToken as LoginGenerateRefreshToken,
	hashRefreshToken as LoginHashRefreshToken,
	setRefreshTokenCookie,
} from "@/lib/auth";
import { db } from "@/lib/db";
import { response, serverErrorResponse } from "@/lib/helpers/api-helpers";
import { getApiI18nContext } from "@/lib/helpers/api-i18n-context";

export async function POST(req: Request) {
	let t;

	try {
		const { t: translations } = await getApiI18nContext(req);
		t = translations;

		const { email, password, rememberMe } = await req.json();
		if (!email || !password) {
			return response({ message: t("auth.login.required") }, 400);
		}

		const user = await db.user.findUnique({ where: { email } });
		if (!user) {
			return response({ message: t("auth.login.unauthorized") }, 401);
        }

        const isPasswordValid = await LoginComparePassword(password, user.passwordHash);
		if (!isPasswordValid) {
			return response({ message: t("auth.login.unauthorized") }, 401);
		}

		if (!user.isVerified) {
			return response(
				{
					message: t("auth.login.verified"),
					data: { id: user.id, email: user.email, isVerified: user.isVerified },
				},
				403
			);
		}

		// Payload for the JWT (information about the user)
		// IMPORTANT: Do NOT include sensitive info like password_hash here.
		const accessTokenPayload = {
			id: user.id,
			username: user.username,
			email: user.email,
		};
		const accessToken = await LoginGenerateAccessToken(accessTokenPayload);
		const refreshToken = LoginGenerateRefreshToken();
		const hashedRefreshToken = await LoginHashRefreshToken(refreshToken); // Hashed refresh token
		const refreshTokenExpiresAt = new Date();
		refreshTokenExpiresAt.setDate(refreshTokenExpiresAt.getDate() + 7); // Refresh token valid for 7 days
		// Update user's refresh token in the database
		await db.user.update({
			where: { id: user.id },
			data: {
				refreshTokenHash: hashedRefreshToken,
				refreshTokenExpiresAt: refreshTokenExpiresAt,
			},
		});

		await setRefreshTokenCookie(refreshToken, rememberMe);

		const { passwordHash, refreshTokenHash, ...userWithoutHash } = user; // Destructure to remove password_hash
		return response({ message: t("auth.login.success"), data: { accessToken, user: userWithoutHash } });
	} catch (err: any) {
		return serverErrorResponse(err.message);
	}
}
