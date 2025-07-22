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
			return response({ message: t("auth.verify.email_not_registered") }, 404);
		}

		if (user.isVerified) {
			return response({ message: t("auth.verify.verified") }, 409);
		}

		const verificationToken = generateToken();
		const expiration = new Date(Date.now() + 30 * 60 * 1000); // 30 phút
		await db.user.update({
			where: { email },
			data: {
				verificationToken: verificationToken,
				verificationTokenExpiresAt: expiration,
			},
		});

		const mailOptions = {
			to: email,
			subject: t("auth.email.subject"),
			html: t("auth.email.html", {
				link: `http://localhost:3000/api/auth/verify?token=${verificationToken}`,
			}),
		};
		await sendEmail(mailOptions);

		return response({ message: t("auth.verify.sent") }, 200);
	} catch (error) {
		console.error("Lỗi gửi lại email xác thực:", error);
		return Response.json({ error: "Lỗi server" }, { status: 500 });
	}
}
