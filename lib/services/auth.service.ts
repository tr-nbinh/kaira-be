import { renderEmailTemplate, sendEmail } from "@/email/mailer";
import crypto from "crypto";
import { cookies, headers } from "next/headers";
import { comparePassword, generateAccessToken, hashPassword, hashRefreshToken, setRefreshTokenCookie } from "../auth";
import { db } from "../db";
import { ApiError } from "../utils/api-error";
import { LoginInput, RegisterInput, ResetPasswordInput } from "../validations/auth.validation";

export const authService = {
	async register({ email, username, password, confirmPassword }: RegisterInput, t: Function) {
		const existingUser = await db.user.findUnique({ where: { email } });
		if (existingUser) {
			throw new ApiError(t("auth.register.email_used"), 409);
		}

		const hashedPassword = await hashPassword(password);
		const verificationToken = crypto.randomBytes(32).toString("hex");
		const verificationTokenExp = new Date(Date.now() + 30 * 60 * 1000);
		await db.user.create({
			data: {
				email,
				username,
				passwordHash: hashedPassword,
				verificationToken: verificationToken,
				verificationTokenExpiresAt: verificationTokenExp,
			},
		});

		const replaceObj = {
			title: t("email.verify_email.title"),
			description: t("email.verify_email.description"),
			button_text: t("email.verify_email.button_text"),
			footer: t("email.verify_email.footer"),
			verify_link: `${process.env.FRONTEND_URL}/auth/confirm-email?token=${verificationToken}`,
		};
		const html = await renderEmailTemplate("verify-email.html", replaceObj);
		const mailOptions = {
			to: email,
			subject: t("auth.email.subject"),
			html,
		};
		await sendEmail(mailOptions);

		return { email, isVerified: false };
	},

	async verifyEmail(token: string) {
		const user = await db.user.findFirst({
			where: {
				verificationToken: token,
				verificationTokenExpiresAt: { gte: new Date() },
			},
		});
		if (!user) {
			throw new ApiError("Token is expired or invalid", 400);
		}

		await db.user.update({
			where: { id: user.id },
			data: {
				isVerified: true,
				verificationToken: null,
				verificationTokenExpiresAt: null,
				resend_count: 0,
				last_resent_at: null,
			},
		});

		return { isVerified: true };
	},

	async forgotPasswor(email: string, t: Function) {
		const user = await db.user.findUnique({
			where: { email },
		});
		if (!user) {
			throw new ApiError(t("auth.reset_password.email_not_registered"), 404);
		}

		const resetToken = crypto.randomBytes(32).toString("hex");
		const expiration = new Date(Date.now() + 30 * 60 * 1000); // 30 phút
		await db.user.update({
			where: { email },
			data: {
				resetToken: resetToken,
				resetTokenExpire: expiration,
			},
		});

		const resetLink = `${process.env.FRONTEND_URL}/auth/reset-password?token=${resetToken}`;
		const replaceObj = {
			title: t("email.reset_password.title"),
			description: t("email.reset_password.description"),
			button_text: t("email.reset_password.button_text"),
			footer: t("email.reset_password.footer"),
			verify_link: resetLink,
		};
		const html = await renderEmailTemplate("verify-email.html", replaceObj);
		const mailOptions = {
			to: email,
			subject: t("auth.reset_password.subject"),
			html,
		};
		await sendEmail(mailOptions);
	},

	async resetPassword({ token, password, confirmPassword }: ResetPasswordInput, t: Function) {
		const user = await db.user.findUnique({
			where: {
				resetToken: token,
				resetTokenExpire: { gte: new Date() },
			},
		});
		if (!user) {
			throw new ApiError(t("auth.reset_password.error"), 404);
		}

		const hashedPassword = await hashPassword(password);
		await db.user.update({
			where: { id: user.id },
			data: {
				passwordHash: hashedPassword,
				resetToken: null,
				resetTokenExpire: null,
			},
		});

		return { isResetedPassword: true };
	},

	async resendEmail(email: string, t: Function) {
		const user = await db.user.findUnique({
			where: { email },
		});
		if (!user) {
			throw new ApiError(t("auth.verify.email_not_registered"), 404);
		}

		if (user.isVerified) {
			throw new ApiError(t("auth.verify.verified"), 409);
		}

		const now = new Date();
		const lastSent = user.last_resent_at ? new Date(user.last_resent_at) : new Date(0);
		const waitTimes = [60, 180, 600, 1800];
		const waitTime =
			waitTimes[Math.min(user.resend_count - 1 < 0 ? 0 : user.resend_count - 1, waitTimes.length - 1)];

		const secondsElapsed = Math.floor((now.getTime() - lastSent.getTime()) / 1000);
		if (secondsElapsed < waitTime) {
			const remaining = waitTime - secondsElapsed;
			throw new ApiError(t("auth.resend_email.too_many"), 429, undefined, {
				retryAfter: remaining,
			});
		}

		const verificationToken = crypto.randomBytes(32).toString("hex");
		const expiration = new Date(Date.now() + 30 * 60 * 1000); // 30 phút
		await db.user.update({
			where: { email },
			data: {
				verificationToken: verificationToken,
				verificationTokenExpiresAt: expiration,
				last_resent_at: now,
				resend_count: user.resend_count + 1,
			},
		});

		const replaceObj = {
			title: t("email.verify_email.title"),
			description: t("email.verify_email.description"),
			button_text: t("email.verify_email.button_text"),
			footer: t("email.verify_email.footer"),
			verify_link: `${process.env.FRONTEND_URL}/auth/confirm-email?token=${verificationToken}`,
		};
		const html = await renderEmailTemplate("verify-email.html", replaceObj);
		const mailOptions = {
			to: email,
			subject: t("auth.email.subject"),
			html,
		};
		await sendEmail(mailOptions);
	},

	async login({ email, password, rememberMe }: LoginInput, t: Function) {
		const user = await db.user.findUnique({ where: { email } });
		if (!user) {
			throw new ApiError(t("auth.login.unauthorized"), 401);
		}

		const isPasswordValid = await comparePassword(password, user.passwordHash);
		if (!isPasswordValid) {
			throw new ApiError(t("auth.login.unauthorized"), 401);
		}

		if (!user.isVerified) {
			throw new ApiError(t("auth.login.verified"), 403, undefined, { email: user.email });
		}

		const accessTokenPayload = {
			id: user.id,
			username: user.username,
			email: user.email,
		};
		const accessToken = await generateAccessToken(accessTokenPayload);
		const refreshToken = crypto.randomBytes(32).toString("hex");
		const refreshTokenHash = await hashRefreshToken(refreshToken);
		const expiresAt = new Date();
		expiresAt.setDate(expiresAt.getDate() + 7); // refresh token 7d

		await db.refresh_tokens.create({
			data: {
				user_id: user.id,
				token_hash: refreshTokenHash,
				expires_at: expiresAt,
				remember_me: rememberMe,
				user_agent: (await headers()).get("user-agent"),
			},
		});

		const maxAge = rememberMe ? 7 * 24 * 60 * 60 : undefined;
		await setRefreshTokenCookie(refreshToken, maxAge);

		return { accessToken };
	},

	async refreshToken(oldRefreshToken: string, t: Function) {
		const oldRefreshTokenHash = await hashRefreshToken(oldRefreshToken);
		const token = await db.refresh_tokens.findFirst({
			where: { token_hash: oldRefreshTokenHash },
		});
		if (!token) {
			throw new ApiError(t("auth.refresh.invalid_token"), 401);
		}
		if (token.expires_at < new Date()) {
			await db.refresh_tokens.delete({ where: { id: token.id } });
			throw new ApiError(t("auth.refresh.token_expired"), 401);
		}
		if (token.is_revoked) {
			await db.refresh_tokens.deleteMany({ where: { user_id: token.user_id } });
			throw new ApiError(t("auth.refresh.revoked"), 403);
		}

		const newAccessTokenPayload = {
			id: token.user_id,
		};
		const accessToken = await generateAccessToken(newAccessTokenPayload);
		const newRefreshToken = crypto.randomBytes(32).toString("hex");
		const newRefreshTokenHash = await hashRefreshToken(newRefreshToken);
		const expiresAt = new Date();
		expiresAt.setDate(expiresAt.getDate() + 7); // New refresh token valid for 7 days

		const newToken = await db.refresh_tokens.create({
			data: {
				user_id: token.user_id,
				token_hash: newRefreshTokenHash,
				expires_at: expiresAt,
				remember_me: token.remember_me,
			},
		});
		await db.refresh_tokens.update({
			where: { id: token.id },
			data: {
				is_revoked: true,
				replaced_by_token_id: newToken.id,
			},
		});

		const maxAge = !!token.remember_me ? 7 * 24 * 60 * 60 : undefined; // 0 để cookie biến mất khi đóng trình duyệt nếu không remember
		await setRefreshTokenCookie(newRefreshToken, maxAge);

		return { accessToken };
	},

	async logout(refreshToken: string) {
		const hash = await hashRefreshToken(refreshToken);
		await db.refresh_tokens.updateMany({
			where: { token_hash: hash },
			data: {
				is_revoked: true,
			},
		});

		await setRefreshTokenCookie("", 0);
	},
};
