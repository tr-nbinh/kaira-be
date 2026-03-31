import { getVndToUsdRate } from "@/lib/currency";
import { sendSuccess } from "@/lib/utils/api-response";
import { handleApiError } from "@/lib/utils/handleError";

export async function GET() {
	try {
		const data = await getVndToUsdRate();
		return sendSuccess({ usd: data }, "Get usd rate successfully");
	} catch (error) {
		return handleApiError(error);
	}
}
