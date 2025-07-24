import { db } from "@/lib/db";
import { handleApiError } from "@/lib/utils/handleError";

export async function GET(req: Request) {
	const angularBaseUrl = "http://localhost:4200/auth";
	const { searchParams } = new URL(req.url);
	const token = searchParams.get("token");

	if (!token) {
		return Response.redirect(new URL(`${angularBaseUrl}/pending-verify?status=error`));
	}

	try {
		const user = await db.user.findFirst({ where: { verificationToken: token } });

		if (!user) {
			return Response.redirect(new URL(`${angularBaseUrl}/pending-verify?status=error`));
		}

		if (user.verificationTokenExpiresAt && new Date() > user.verificationTokenExpiresAt) {
			return Response.redirect(new URL(`${angularBaseUrl}/pending-verify?status=error`));
		}

		// Cập nhật trạng thái xác thực và xóa token
		await db.user.update({
			where: { id: user.id },
			data: {
				isVerified: true,
				verificationToken: null,
				verificationTokenExpiresAt: null,
			},
		});

		return Response.redirect(new URL(`${angularBaseUrl}/pending-verify?status=success`));
	} catch (error) {
		return handleApiError(error);
	}
}
