export function generateOrderNumber(): string {
	const now = new Date();

	const datePart = [
		now.getFullYear().toString().slice(-2),
		String(now.getMonth() + 1).padStart(2, "0"),
		String(now.getDate()).padStart(2, "0"),
	].join("");

	const randomPart = crypto.randomUUID().replaceAll("-", "").slice(0, 6).toUpperCase();

	return `TNB-${datePart}-${randomPart}`;
}
