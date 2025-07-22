import { hashPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { response } from "@/lib/helpers/api-helpers";
import { getApiI18nContext } from "@/lib/helpers/api-i18n-context";
import { handleApiError } from "@/lib/utils/handleError";
import { sendEmail } from "@/lib/utils/sendMail";
import crypto from "crypto";

export async function POST(req: Request) {
	let t;
	try {
		const { t: translations } = await getApiI18nContext(req);
		t = translations;

		const { username, email, password } = await req.json();
		if (!username || !email || !password) {
			return response({ message: t("auth.register.required") }, 400);
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return response({ message: t("auth.register.email_invalid") }, 400);
		}

		const existingUser = await db.user.findUnique({
			where: { email },
		});

		if (existingUser) {
			return response({ message: t("auth.register.email_used") }, 400);
		}

		const hashedPassword = await hashPassword(password);
		const verificationToken = crypto.randomBytes(32).toString("hex");
		const verificationTokenExp = new Date(Date.now() + 30 * 60 * 1000);
		const newUser = await db.user.create({
			data: {
				email,
				username,
				passwordHash: hashedPassword,
				verificationToken: verificationToken,
				verificationTokenExpiresAt: verificationTokenExp,
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
		return response({ message: t("auth.register.success"), data: { user: newUser } }, 201);
	} catch (err) {
		return handleApiError(err);
	}
}
