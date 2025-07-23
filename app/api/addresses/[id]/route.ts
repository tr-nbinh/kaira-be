import { db } from "@/lib/db";
import { getAuthenticatedUserId } from "@/lib/utils/auth-util";
import { handleApiError } from "@/lib/utils/handleError";
import { NextRequest } from "next/server";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	const userId = getAuthenticatedUserId(req);
	if (!userId) {
		return Response.json({ message: "UserId is invalid" }, { status: 400 });
	}

    const { id } = await params;
	const addressId = parseInt(id);
	if (!addressId) {
		return Response.json({ message: "Address id không hợp lệ" }, { status: 400 });
	}

	const { isDefault, ...addressData } = await req.json();

	try {
		const existingAddress = await db.address.findUnique({
			where: { id: addressId, userId: +userId },
		});
		if (!existingAddress) {
			return Response.json({ message: "Địa chỉ không tồn tại" }, { status: 400 });
		}

		if (isDefault != undefined && isDefault) {
			if (!existingAddress.isDefault) {
				await db.address.updateMany({
					where: {
						userId: +userId,
						id: { not: addressId },
						isDefault: true,
					},
					data: { isDefault: false },
				});
			}
		} else {
			if (existingAddress.isDefault) {
				return Response.json({ message: "Không thể không có địa chỉ mặc định" }, { status: 500 });
			}
		}

		const updateAddress = await db.address.update({
			where: { id: addressId },
			data: {
				...addressData,
				isDefault,
			},
		});

		return Response.json(updateAddress, { status: 201 });
	} catch (err) {
		return handleApiError(err);
	}
}
