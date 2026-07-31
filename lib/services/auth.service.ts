import { renderEmailTemplate, sendEmail } from "@/email/mailer";
import { RequestInfo } from "@/models/request-info.model";
import crypto from "crypto";
import { comparePassword, generateAccessToken, hashPassword, hashRefreshToken } from "../auth";
import { db } from "../db";
import { ApiError } from "../utils/api-error";
import { clearAuthCookies, setAuthCookies } from "../utils/authCookies";
import { LoginInput, RegisterInput, ResetPasswordInput, VerifyOtpInput } from "../validations/auth.validation";
import { ERROR_CODES } from "../errors/error-codes";
import bcrypt from "bcryptjs";
import { generateOtp } from "../utils/otp";

export const authService = {
	async register({ email, fullName, password }: RegisterInput, t: Function) {
		const existingUser = await db.user.findUnique({ where: { email } });
		if (existingUser) {
			const data = { email: ERROR_CODES.EMAIL_EXISTS };
			throw new ApiError(t("auth.register.email_used"), 409, undefined, data);
		}

		const hashedPassword = await hashPassword(password);
		const newUser = await db.user.create({
			data: {
				email,
				fullName,
				passwordHash: hashedPassword,
			},
		});

		const { rawOtp, hashedOtp, expiresAt } = await generateOtp();
		const newOtp = await db.otp.create({
			data: {
				code: hashedOtp,
				type: "verifyemail",
				expiresAt,
				userId: newUser.id,
			},
		});

		const replaceObj = {
			otp: rawOtp,
		};
		const html = await renderEmailTemplate("verify-email.html", replaceObj);
		const mailOptions = {
			to: email,
			subject: t("auth.email.subject"),
			html,
		};
		await sendEmail(mailOptions);

		return { verificationId: newOtp.id };
	},

	async forgotPassword(email: string, t: Function) {
		const user = await db.user.findUnique({
			where: { email },
		});
		if (!user) {
			throw new ApiError(t("auth.reset_password.email_not_registered"), 404);
		}

		if (!user.isVerified) {
			throw new ApiError("lỗi", 404);
		}

		const { rawOtp, hashedOtp, expiresAt } = await generateOtp();
		const newOtp = await db.otp.create({
			data: { code: hashedOtp, type: "resetpassword", expiresAt, userId: user.id },
		});
		return { verificationId: newOtp.id };
		// const resetLink = `${process.env.FRONTEND_URL}/auth/reset-password?token=${resetToken}`;
		// const replaceObj = {
		// 	title: t("email.reset_password.title"),
		// 	description: t("email.reset_password.description"),
		// 	button_text: t("email.reset_password.button_text"),
		// 	footer: t("email.reset_password.footer"),
		// 	verify_link: resetLink,
		// };
		// const html = await renderEmailTemplate("verify-email.html", replaceObj);
		// const mailOptions = {
		// 	to: email,
		// 	subject: t("auth.reset_password.subject"),
		// 	html,
		// };
		// await sendEmail(mailOptions);
	},

	async resetPassword({ verificationId, otp, password }: ResetPasswordInput, t: Function) {
		const otpRecord = await db.otp.findUnique({ where: { id: verificationId } });
		if (!otpRecord || otpRecord.isUsed || new Date() > otpRecord.expiresAt) {
			throw new ApiError("Otp không tồn tại hoặc đã hết hạn.", 400, "OTP_INVALID");
		}
		if (otpRecord.type !== "resetpassword") {
			throw new ApiError("Mã xác thực này không hợp lệ cho hành động hiện tại.", 400, "OTP_TYPE_MISMATCH");
		}

		const MAX_ATTEMPTS = 5;
		if (otpRecord.attempts >= MAX_ATTEMPTS) {
			throw new ApiError(
				"Mã OTP này đã bị khóa do sai quá 5 lần. Vui lòng thực hiện lại hành động lấy lại mật khẩu",
				400,
			);
		}

		const isOtpCorrect = await bcrypt.compare(otp, otpRecord.code);
		if (!isOtpCorrect) {
			if (otpRecord.attempts + 1 == MAX_ATTEMPTS) {
				await db.otp.update({ where: { id: verificationId }, data: { isUsed: true } });
			} else {
				await db.otp.update({
					where: { id: verificationId },
					data: { attempts: otpRecord.attempts + 1 },
				});
			}
			throw new ApiError("Mã OTP không chính xác", 400, "OTP_INCORRECT", {
				remainingAttempts: MAX_ATTEMPTS - (otpRecord.attempts == 0 ? 1 : otpRecord.attempts),
			});
		}

		const passwordHashed = await hashPassword(password);
		await db.$transaction([
			db.user.update({
				where: { id: otpRecord.userId },
				data: { isVerified: true, passwordHash: passwordHashed },
			}),
			db.otp.update({ where: { id: verificationId }, data: { isUsed: true } }),
		]);

		return { isResetedPassword: true };
	},

	async login({ email, password, rememberMe }: LoginInput, requestInfo: RequestInfo, t: Function) {
		const user = await db.user.findUnique({ where: { email } });
		if (!user) {
			throw new ApiError(t("auth.login.unauthorized"), 401, ERROR_CODES.INVALID_CREDENTIALS);
		}

		const isPasswordValid = await comparePassword(password, user.passwordHash);
		if (!isPasswordValid) {
			throw new ApiError(t("auth.login.unauthorized"), 401, ERROR_CODES.INVALID_CREDENTIALS);
		}

		if (!user.isVerified) {
			const { rawOtp, hashedOtp, expiresAt } = await generateOtp();
			await db.otp.create({ data: { code: hashedOtp, expiresAt, type: "verifyemail", userId: user.id } });

			throw new ApiError(t("auth.login.verified"), 403, ERROR_CODES.EMAIL_NOT_VERIFIED, { email: user.email });
		}

		const accessTokenPayload = {
			id: user.id,
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
				user_agent: requestInfo.userAgent,
				ip_address: requestInfo.ip,
			},
		});

		await setAuthCookies(accessToken, refreshToken);

		return { id: user.id, avatar_url: user.avatar_url, email: user.email, fullName: user.fullName };
	},

	async refreshToken(oldRefreshToken: string, requestInfo: RequestInfo, t: Function) {
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
				user_agent: requestInfo.userAgent,
				ip_address: requestInfo.ip,
			},
		});
		await db.refresh_tokens.update({
			where: { id: token.id },
			data: {
				is_revoked: true,
				replaced_by_token_id: newToken.id,
			},
		});

		await setAuthCookies(accessToken, newRefreshToken);
	},

	async logout(refreshToken: string | undefined) {
		if (refreshToken) {
			const hash = await hashRefreshToken(refreshToken);
			await db.refresh_tokens.updateMany({
				where: { token_hash: hash },
				data: {
					is_revoked: true,
				},
			});
		}

		await clearAuthCookies();
	},

	async getCurrentUser(userId: number) {
		return await db.user.findUniqueOrThrow({
			where: { id: userId },
			select: { id: true, avatar_url: true, email: true, fullName: true },
		});
	},

	async checkEmailExists(email: string) {
		const emailExisting = await db.user.findUnique({
			where: { email },
		});
		return { isExists: !!emailExisting };
	},

	async getVerificationInfo(verificationId: string) {
		const otpRecord = await db.otp.findUnique({
			where: { id: verificationId },
			include: {
				user: true,
			},
		});
		if (!otpRecord || otpRecord.isUsed || new Date() > otpRecord.expiresAt) {
			throw new ApiError("Phiên xác thực không tồn tại hoặc đã hết hạn.", 400, "SESSION_INVALID");
		}

		const fullEmail = otpRecord.user.email;
		const [namePart, domainPart] = fullEmail.split("@");
		let maskedEmail = "";
		if (namePart.length <= 2) {
			maskedEmail = `${namePart[0]}*@${domainPart}`;
		} else {
			maskedEmail = `${namePart.slice(0, 2)}${"*".repeat(namePart.length - 3)}${namePart.slice(-1)}@${domainPart}`;
		}

		return { email: maskedEmail };
	},

	async verifyOtp(payload: VerifyOtpInput) {
		const otpRecord = await db.otp.findUnique({
			where: { id: payload.verificationId },
		});
		if (!otpRecord || otpRecord.isUsed || new Date() > otpRecord.expiresAt) {
			throw new ApiError("Otp không tồn tại hoặc đã hết hạn.", 400, "OTP_INVALID");
		}
		if (otpRecord.type !== payload.otpType) {
			throw new ApiError("Mã xác thực này không hợp lệ cho hành động hiện tại.", 400, "OTP_TYPE_MISMATCH");
		}

		const MAX_ATTEMPTS = 5;
		if (otpRecord.attempts >= MAX_ATTEMPTS) {
			throw new ApiError(
				"Mã OTP này đã bị khóa do nhập sai quá 5 lần. Vui lòng bấm 'Gửi lại mã' để nhận mã mới",
				400,
			);
		}

		const isOtpCorrect = await bcrypt.compare(payload.otp, otpRecord.code);
		if (!isOtpCorrect) {
			if (otpRecord.attempts + 1 == MAX_ATTEMPTS) {
				await db.otp.update({
					where: { id: payload.verificationId },
					data: { isUsed: true, attempts: otpRecord.attempts + 1 },
				});
			} else {
				await db.otp.update({
					where: { id: payload.verificationId },
					data: { attempts: otpRecord.attempts + 1 },
				});
			}
			throw new ApiError("Mã OTP không chính xác", 400, "OTP_INCORRECT", {
				remainingAttempts: MAX_ATTEMPTS - (otpRecord.attempts + 1),
			});
		}

		await db.$transaction([
			db.user.update({ where: { id: otpRecord.userId }, data: { isVerified: true } }),
			db.otp.update({ where: { id: payload.verificationId }, data: { isUsed: true } }),
		]);

		return { code: "VERIFY_EMAIL_SUCCESS", message: "Kích hoạt tài khoản thành công!" };
	},

	async resendOtp(verificationId: string) {
		const oldOtpRecord = await db.otp.findUnique({
			where: { id: verificationId },
			include: { user: true },
		});
		if (!oldOtpRecord || oldOtpRecord.isUsed || new Date() > oldOtpRecord.expiresAt) {
			throw new ApiError("Phiên xác thực không tồn tại hoặc hết hạn", 400);
		}

		const timePassed = Date.now() - oldOtpRecord.createdAt.getTime();
		const COOLDOWN_TIME = 60 * 1000; // 60 giây đổi ra ms
		if (timePassed < COOLDOWN_TIME) {
			const remainingSeconds = Math.ceil((COOLDOWN_TIME - timePassed) / 1000);
			throw new ApiError("Too many request", 429, "OTP_SPAM_LIMIT", {
				code: "OTP_SPAM_LIMIT",
				message: `Vui lòng đợi ${remainingSeconds} giây nữa trước khi bấm gửi lại.`,
				remainingSeconds,
			});
		}

		await db.otp.update({
			where: { id: verificationId },
			data: { isUsed: true },
		});

		const newRawOtp = crypto.randomInt(100000, 999999).toString();
		const newHashedOtp = await bcrypt.hash(newRawOtp, 10);
		const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
		const newOtpRecord = await db.otp.create({
			data: {
				code: newHashedOtp,
				type: oldOtpRecord.type,
				expiresAt: expiresAt,
				userId: oldOtpRecord.userId,
			},
		});

		const replaceObj = {
			otp: newRawOtp,
		};
		const html = await renderEmailTemplate("verify-email.html", replaceObj);
		const mailOptions = {
			to: oldOtpRecord.user.email,
			subject: "Xác thực tài khoản",
			html,
		};
		await sendEmail(mailOptions);

		return { verificationId: newOtpRecord.id };
	},
};
