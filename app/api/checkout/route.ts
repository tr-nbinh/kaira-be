import { getApiI18nContext } from "@/lib/helpers/api-i18n-context";
import { checkoutService } from "@/lib/services/checkout.service";
import { ApiError } from "@/lib/utils/api-error";
import { sendSuccess } from "@/lib/utils/api-response";
import { getAuthenticatedUserId } from "@/lib/utils/auth-util";
import { handleApiError } from "@/lib/utils/handleError";
import { CheckoutSchema } from "@/lib/validations/checkout.validation";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
	try {
		const { t } = await getApiI18nContext(req);
		const userId = getAuthenticatedUserId(req);
		if (!userId) {
			throw new ApiError(t("auth.unauthorized"), 401);
		}

		const body = await req.json();
		const parsed = CheckoutSchema.parse(body);
		const data = await checkoutService.checkout(parsed, userId, t);
		return sendSuccess(data, t("order.success"));
	} catch (err) {
		return handleApiError(err);
	}
}
