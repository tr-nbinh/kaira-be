import { locationService } from "@/lib/services/location.service";
import { sendSuccess } from "@/lib/utils/api-response";
import { handleApiError } from "@/lib/utils/handleError";

type RouteParams = {
	provinceCode: number;
};

export async function GET(request: Request, { params }: { params: Promise<RouteParams> }) {
	try {
		const { provinceCode } = await params;
		const data = await locationService.getWardsByProvinceCode(provinceCode);
		return sendSuccess(data);
	} catch (error) {
		return handleApiError(error);
	}
}
