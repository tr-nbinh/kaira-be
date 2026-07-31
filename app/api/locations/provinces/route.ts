import { locationService } from "@/lib/services/location.service";
import { sendSuccess } from "@/lib/utils/api-response";
import { handleApiError } from "@/lib/utils/handleError";

export async function GET() {
	try {
		const data = await locationService.getProvinces();
		return sendSuccess(data);
	} catch (error) {
		return handleApiError(error);
	}
}
