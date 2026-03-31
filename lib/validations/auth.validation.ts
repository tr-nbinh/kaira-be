import { email, z } from "zod";

const emailSchema = z.email("Email không đúng định dạng");
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
		username: z
			.string()
			.min(3, "Tên đăng nhập phải có ít nhất 3 ký tự")
			.max(15, "Tên đăng nhập không được quá 20 ký tự"),

		email: z.email("Email không đúng định dạng"),
		password: passwordSchema,
		confirmPassword: z.string(),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Mật khẩu xác nhận không khớp",
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
		token: tokenSchema,
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
