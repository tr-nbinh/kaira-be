import pool from "@/lib/db";
import { response } from "@/lib/helpers/api-helpers";
import { getApiI18nContext } from "@/lib/helpers/api-i18n-context";
import { handleApiError } from "@/lib/utils/handleError";

export async function GET(req: Request, context: { params: { id: string } }) {
	try {
		const { t, locale } = await getApiI18nContext(req);

		const params = await context.params;
		const id = parseInt(params.id, 10);
		if (isNaN(id)) {
			return response({ message: t("product.item_not_found") }, 400);
		}

		const result = await pool.query("SELECT * FROM get_product_details($1, $2)", [id, locale]);
		if (!result) {
			return response({ message: t("product.item_not_found") }, 404);
		}

		return Response.json(result.rows[0], { status: 200 });
	} catch (err) {
		return handleApiError(err);
	}
}
