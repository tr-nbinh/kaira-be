import { db } from "../db";
import { ApiError } from "../utils/api-error";
import { AddressInput, UpdateAddressInput } from "../validations/address.validation";

export const addressService = {
	async getAddressByUserId(userId: number) {
		const addresses = await db.address.findMany({
			where: { userId: userId },
			select: {
				id: true,
				districtCode: true,
				receiverName: true,
				provinceCode: true,
				wardCode: true,
				street: true,
				address: true,
				addressExtra: true,
				phone: true,
				email: true,
				isDefault: true,
			},
		});
		return addresses;
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
				receiverName: data.receiverName,
				provinceCode: data.provinceCode,
				districtCode: data.districtCode,
				wardCode: data.wardCode,
				address: data.address,
				addressExtra: data.addressExtra,
				phone: data.phone,
				email: data.email,
				isDefault: data.isDefault,
				street: data.street,
				userId: userId,
			},
		});

		return newAddress;
	},

	async updateAddress(data: UpdateAddressInput, userId: number, addressId: number) {
		const existingAddress = await db.address.findUnique({
			where: { id: addressId, userId },
		});
		if (!existingAddress) {
			throw new ApiError("Address not found", 400);
		}

		if (data.isDefault) {
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
			data,
		});

		return updateAddress;
	},
};
