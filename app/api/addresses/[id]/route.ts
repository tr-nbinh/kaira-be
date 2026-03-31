import { getApiI18nContext } from "@/lib/helpers/api-i18n-context";
import { addressService } from "@/lib/services/address.service";
import { ApiError } from "@/lib/utils/api-error";
import { sendSuccess } from "@/lib/utils/api-response";
import { getAuthenticatedUserId } from "@/lib/utils/auth-util";
import { handleApiError } from "@/lib/utils/handleError";
import { UpdateAddressSchema } from "@/lib/validations/address.validation";
import { NextRequest } from "next/server";

interface RouteParams {
	id: string;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<RouteParams> }) {
	try {
		const { t } = await getApiI18nContext(req);
		const userId = getAuthenticatedUserId(req);
		if (!userId) {
			throw new ApiError(t("auth.unauthorized"), 401);
		}

		const { id } = await params;
		const addressId = parseInt(id);
		const addressData = await req.json();
		const validatedData = UpdateAddressSchema.parse({ ...addressData, addressId });

		const data = await addressService.updateAddress(validatedData, userId, addressId);
		return sendSuccess(data, t("address.update_success"));
	} catch (err) {
		return handleApiError(err);
	}
}
