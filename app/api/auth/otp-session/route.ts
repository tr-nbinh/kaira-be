// app/api/auth/otp-session/route.ts
import { authService } from "@/lib/services/auth.service";
import { sendSuccess } from "@/lib/utils/api-response";
import { handleApiError } from "@/lib/utils/handleError";
import { ResendOtpSchema } from "@/lib/validations/auth.validation";

export async function GET(req: Request) {
	try {
		const { searchParams } = new URL(req.url);
		const verificationId = searchParams.get("id");
		const validatedVerificationId = ResendOtpSchema.parse({ verificationId });
		const data = await authService.getVerificationInfo(validatedVerificationId.verificationId);
		return sendSuccess(data);
	} catch (error) {
		return handleApiError(error);
	}
}
