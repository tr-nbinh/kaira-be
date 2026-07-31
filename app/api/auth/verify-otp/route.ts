// app/api/auth/verify-otp/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { VerifyOtpSchema } from "@/lib/validations/auth.validation";
import { authService } from "@/lib/services/auth.service";
import { sendSuccess } from "@/lib/utils/api-response";
import { handleApiError } from "@/lib/utils/handleError";

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const validatedBody = VerifyOtpSchema.parse(body);
		const data = await authService.verifyOtp(validatedBody);
		return sendSuccess(data);
	} catch (error) {
		return handleApiError(error);
	}
}
