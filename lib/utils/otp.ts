import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function generateOtp() {
	const rawOtp = crypto.randomInt(100000, 999999).toString();
	const hashedOtp = await bcrypt.hash(rawOtp, 10);

	const otpExpiryDuration = 5 * 60 * 1000; // 5 phút
	const expiresAt = new Date(Date.now() + otpExpiryDuration);

	return {
		rawOtp,
		hashedOtp,
		expiresAt,
	};
}
