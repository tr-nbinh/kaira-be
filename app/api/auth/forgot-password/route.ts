import { generateToken } from "@/lib/auth";
import { db } from "@/lib/db";
import { response } from "@/lib/helpers/api-helpers";
import { getApiI18nContext } from "@/lib/helpers/api-i18n-context";
import { sendEmail } from "@/lib/utils/sendMail";

export async function POST(req: Request) {
	try {
		const { t } = await getApiI18nContext(req);

		const { email } = await req.json();
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return response({ message: t("auth.register.email_invalid") }, 400);
		}

		const user = await db.user.findUnique({
			where: { email },
		});
		if (!user) {
			return response({ message: t("auth.reset_password.email_not_registered") }, 404);
		}

		const resetToken = generateToken();
		const expiration = new Date(Date.now() + 30 * 60 * 1000); // 30 phút
		await db.user.update({
			where: { email },
			data: {
				resetToken: resetToken,
				resetTokenExpire: expiration,
			},
		});

		const resetLink = `${process.env.FRONTEND_URL}/auth/reset-password?token=${resetToken}`;
		const htmlContent = t("auth.reset_password.html", { link: resetLink });
		const mailOptions = {
			to: email,
			subject: t("auth.reset_password.subject"),
			html: htmlContent,
		};
		await sendEmail(mailOptions);

		return response({ message: t("auth.reset_password.sent") }, 200);
	} catch (error) {
		return Response.json({ error: "Lỗi server" }, { status: 500 });
	}
}
