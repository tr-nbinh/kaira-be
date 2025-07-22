// /app/api/auth/reset-password/route.ts
import { hashPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { response, serverErrorResponse } from "@/lib/helpers/api-helpers";
import { getApiI18nContext } from "@/lib/helpers/api-i18n-context";

export async function POST(req: Request) {
	try {
        const { t } = await getApiI18nContext(req);

		const { token, password } = await req.json();
		if (!token || !password) {
			return response({ message: t('auth.reset_password.required') }, 400);
		}
        console.log(token);
		const user = await db.user.findUnique({
			where: {
				resetToken: token,
				resetTokenExpire: { gte: new Date() },
			},
		});
		if (!user) {
			return response({ message: t('auth.reset_password.error')}, 404);
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

		return response({ message: t('auth.reset_password.succes') }, 200);
	} catch (error: any) {
		return serverErrorResponse(error.message);
	}
}
