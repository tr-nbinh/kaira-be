import { z } from "zod";

export const AddressSchema = z.object({
	receiverName: z.string().min(2),
	provinceCode: z.string().min(1),
	districtCode: z.string().min(1),
	wardCode: z.string().min(1),
	address: z.string().min(5),
	addressExtra: z.string().optional().nullable(),
	phone: z.string().regex(/^(0|\+84)[3|5|7|8|9][0-9]{8}$/),
	email: z.email(),
	isDefault: z.boolean().default(false),
	street: z.string().min(2),
});
export type AddressInput = z.infer<typeof AddressSchema>;

export const UpdateAddressSchema = AddressSchema.partial();
export type UpdateAddressInput = z.infer<typeof UpdateAddressSchema>;
