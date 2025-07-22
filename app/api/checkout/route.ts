import { db } from "@/lib/db";
import { response } from "@/lib/helpers/api-helpers";
import { getApiI18nContext } from "@/lib/helpers/api-i18n-context";
import { getAuthenticatedUserId } from "@/lib/utils/auth-util";
import { handleApiError } from "@/lib/utils/handleError";
import { randomUUID } from "crypto";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
	try {
		const { t } = await getApiI18nContext(req);

		const userId = getAuthenticatedUserId(req);
		if (!userId) {
			return response({ message: t("auth.unauthorized") }, 401);
		}

		const body = await req.json();
		const { cartId } = body;
		const uuid = randomUUID();

		const session = await db.checkoutSession.create({
			data: {
				sessionId: uuid,
				userId: userId,
				cartId: cartId,
			},
		});

		return Response.json({ uuid });
	} catch (err) {
		return handleApiError(err);
	}
}
