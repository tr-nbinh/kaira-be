import { otp_type } from "@prisma/client";
import { z } from "zod";

const emailSchema = z.email("Invalid email format");
const tokenSchema = z.string().min(1, "Token is required");
const passwordSchema = z
	.string()
	.min(6, "Mật khẩu phải có ít nhất 6 ký tự")
	// Bạn có thể thêm regex kiểm tra độ mạnh mật khẩu ở đây
	.regex(
		/^(?=.*[0-9])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).*$/,
		"Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 số và 1 ký tự đặc biệt",
	);

export const RegisterSchema = z
	.object({
		fullName: z
			.string()
			.min(2, "Full name must be at least 2 characters")
			.max(50, "Full name must be at most 50 characters"),

		email: emailSchema,
		password: passwordSchema,
		confirmPassword: z.string(),
		agreeTerms: z.boolean().refine((val) => val === true, {
			message: "You must accept terms",
		}),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"], // Lỗi sẽ được gán chính xác vào field này
	});
export type RegisterInput = z.infer<typeof RegisterSchema>;

export const VerifySchema = z.object({
	token: tokenSchema,
});

export const ForgotPasswordSchema = z.object({
	email: emailSchema,
});

export const ResetPasswordSchema = z
	.object({
		verificationId: z.uuid(),
		otp: z.string().regex(/^\d{6}$/, "OTP must contain exactly 6 digits"),
		password: passwordSchema,
		confirmPassword: z.string(),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Mật khẩu xác nhận không khớp",
		path: ["confirmPassword"], // Lỗi sẽ được gán chính xác vào field này
	});
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

export const ResendEmailSchema = z.object({
	email: emailSchema,
});

export const LoginSchema = z.object({
	email: emailSchema,
	password: passwordSchema,
	rememberMe: z.boolean().optional().default(false),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const CheckEmailExistSchema = z.object({
	email: emailSchema,
});

export const OtpSessionSchema = z.object({
	verificationId: z.uuid(),
});

export const VerifyOtpSchema = z.object({
	verificationId: z.uuid(),
	otp: z.string().regex(/^\d{6}$/, "OTP must contain exactly 6 digits"),
	otpType: z.enum(otp_type),
});
export type VerifyOtpInput = z.infer<typeof VerifyOtpSchema>;

export const ResendOtpSchema = z.object({
	verificationId: z.uuid(),
});
