import { authService } from "@/lib/services/auth.service";
import { sendSuccess } from "@/lib/utils/api-response";
import { handleApiError } from "@/lib/utils/handleError";
import { ResendOtpSchema } from "@/lib/validations/auth.validation";

export async function POST(req: Request) {
	try {
		const { verificationId } = await req.json();
		const validatedVerificationId = ResendOtpSchema.parse({ verificationId });
		const data = await authService.resendOtp(validatedVerificationId.verificationId);
		return sendSuccess(data);
	} catch (error) {
		return handleApiError(error);
	}
}
