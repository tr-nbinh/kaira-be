import { authService } from "@/lib/services/auth.service";
import { sendSuccess } from "@/lib/utils/api-response";
import { handleApiError } from "@/lib/utils/handleError";
import { CheckEmailExistSchema } from "@/lib/validations/auth.validation";

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const { email } = body;
		const validatedEmail = CheckEmailExistSchema.parse({ email });
		const data = await authService.checkEmailExists(validatedEmail.email);
		return sendSuccess(data);
	} catch (error) {
		return handleApiError(error);
	}
}
