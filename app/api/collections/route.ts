import { getLocaleFromRequest } from "@/lib/helpers/api-i18n-context";
import { CollectionService } from "@/lib/services/collection.service";
import { sendSuccess } from "@/lib/utils/api-response";
import { handleApiError } from "@/lib/utils/handleError";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
	try {
		const locale = getLocaleFromRequest(req);
		const data = await CollectionService.getCollections(locale);
		return sendSuccess(data);
	} catch (error) {
		return handleApiError(error);
	}
}
