import { db } from "@/lib/db";
import { response } from "@/lib/helpers/api-helpers";
import { getApiI18nContext } from "@/lib/helpers/api-i18n-context";
import { getAuthenticatedUserId } from "@/lib/utils/auth-util";
import { handleApiError } from "@/lib/utils/handleError";
import { NextRequest } from "next/server";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ variantId: string }> }) {
    
    try {
        const { t } = await getApiI18nContext(req);
    
        const userId = getAuthenticatedUserId(req);
        if (!userId) {
            return response({ message: t("auth.unauthorized") }, 401);
        }
        
        const { variantId } = await params;
        const newVariantId = parseInt(variantId);
        if (!newVariantId) {
            return response({ message: t("wishlist.item_not_found") }, 400);
    
        }

		const wishlist = await db.wishlist.findFirst({
			where: { userId: userId },
		});
        if(!wishlist) {
            return response({ message: t('wishlist.wishlist_not_found') }, 404);
        }
        await db.wishlistItem.delete({
            where: { wishlistId_variantId: { wishlistId: wishlist.id, variantId: newVariantId } },
        });

		const totalItems = await db.wishlistItem.count({
			where: { wishlistId: wishlist.id },
		});

		return response({ message: t("wishlist.delete_success"), data: totalItems });
	} catch (err) {
		handleApiError(err);
	}
}
