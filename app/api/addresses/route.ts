import { db } from "@/lib/db";
import { getApiI18nContext } from "@/lib/helpers/api-i18n-context";
import { addressService } from "@/lib/services/address.service";
import { ApiError } from "@/lib/utils/api-error";
import { sendSuccess } from "@/lib/utils/api-response";
import { getAuthenticatedUserId } from "@/lib/utils/auth-util";
import { handleApiError } from "@/lib/utils/handleError";
import { AddressSchema } from "@/lib/validations/address.validation";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
	try {
		const { t } = await getApiI18nContext(req);
		const userId = getAuthenticatedUserId(req);
		if (!userId) {
			throw new ApiError(t("auth.unauthorized"), 401);
		}

		const data = await addressService.getAddressByUserId(userId);
		return sendSuccess(data, "Get addresses successfully");
	} catch (error) {
		return handleApiError(error);
	}
}

export async function POST(req: NextRequest) {
	try {
		const { t } = await getApiI18nContext(req);
		const userId = getAuthenticatedUserId(req);
		if (!userId) {
			throw new ApiError(t("auth.unauthorized"), 401);
		}
		const addressData = await req.json();
		const validatedDat = AddressSchema.parse(addressData);
		const data = await addressService.createAddress(validatedDat, userId);
		return sendSuccess(data, t("address.success"));
	} catch (error) {
		return handleApiError(error);
	}
}
