import { db } from "../db";
import { AddressInput, UpdateAddressInput } from "../validations/address.validation";

export const addressService = {
	async getAddressByUserId(userId: number) {
		const addresses = await db.address.findMany({
			where: { userId },
		});
		return addresses;
	},

	async getDefaultAddressByUserId(userId: number) {
		const address = await db.address.findFirst({
			where: { userId, isDefault: true },
		});

		return address ? address : null;
	},

	async createAddress(data: AddressInput, userId: number) {
		if (data.isDefault) {
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
				...data,
				userId,
			},
		});
		return newAddress;
	},

	async updateAddress(data: UpdateAddressInput, userId: number, addressId: number) {
		// const existingAddress = await db.address.findUnique({
		// 	where: { id: addressId, userId },
		// });
		// if (!existingAddress) {
		// 	throw new ApiError("Address not found", 400);
		// }
		// if (data.isDefault) {
		// 	if (!existingAddress.isDefault) {
		// 		await db.address.updateMany({
		// 			where: {
		// 				userId: +userId,
		// 				id: { not: addressId },
		// 				isDefault: true,
		// 			},
		// 			data: { isDefault: false },
		// 		});
		// 	}
		// } else {
		// 	if (existingAddress.isDefault) {
		// 		return Response.json({ message: "Không thể không có địa chỉ mặc định" }, { status: 500 });
		// 	}
		// }
		// const updateAddress = await db.address.update({
		// 	where: { id: addressId },
		// 	data,
		// });
		// return updateAddress;
	},
};
