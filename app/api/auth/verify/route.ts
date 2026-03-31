import { db } from "@/lib/db";
import { authService } from "@/lib/services/auth.service";
import { sendSuccess } from "@/lib/utils/api-response";
import { handleApiError } from "@/lib/utils/handleError";
import { VerifySchema } from "@/lib/validations/auth.validation";

export async function GET(req: Request) {
	const angularBaseUrl = `${process.env.FRONTEND_URL}/auth`;
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

export async function POST(req: Request) {
	try {
		const { token } = await req.json();
		console.log(token);
		const validatedData = VerifySchema.parse({ token });
		const data = await authService.verifyEmail(validatedData.token);
		return sendSuccess(data, "Verify your email successfully");
	} catch (error) {
		return handleApiError(error);
	}
}
