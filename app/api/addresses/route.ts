import { db } from "@/lib/db";
import { getAuthenticatedUserId } from "@/lib/utils/auth-util";
import { handleApiError } from "@/lib/utils/handleError";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
	const userId = getAuthenticatedUserId(req);
	if (!userId) {
		return Response.json({ message: "UserId is invalid" }, { status: 400 });
	}

	try {
		const addresses = await db.address.findMany({
			where: { userId: userId },
            select: {
                id: true,
                receiverName: true,
                provinceCode: true,
                wardCode: true,
                street: true,
                address: true,
                addressExtra: true,
                phone: true,
                email: true,
                isDefault: true
            }
		});

		return Response.json(addresses, { status: 201 });
	} catch (error) {
		return handleApiError(error);
	}
}

export async function POST(req: NextRequest) {
	const userId = getAuthenticatedUserId(req);
	if (!userId) {
		return Response.json({ message: "UserId is invalid" }, { status: 400 });
	}

	try {
		const addressData = await req.json();
		if (addressData.isDefault) {
			await db.address.updateMany({
				where: {
					userId: +userId,
					isDefault: true,
				},
				data: {
					isDefault: false,
				},
			});
		}

		const newAddress = await db.address.create({
			data: {
				receiverName: addressData.receiverName,
				provinceCode: addressData.provinceCode,
				districtCode: addressData.districtCode,
				wardCode: addressData.wardCode,
				address: addressData.address,
				addressExtra: addressData.addressExtra,
				phone: addressData.phone,
				email: addressData.email,
				isDefault: addressData.isDefault,
				street: addressData.street,
				userId: +userId,
			},
		});

		if (!newAddress) {
			return Response.json({ message: "Failed to create address" }, { status: 500 });
		}

		return Response.json(newAddress, { status: 201 });
	} catch (error) {
		return handleApiError(error);
	}
}
