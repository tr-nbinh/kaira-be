import { z } from "zod";

export const AddressSchema = z.object({
	fullName: z.string().min(2),
	phone: z.string().regex(/^(0|\+84)[3|5|7|8|9][0-9]{8}$/),
	addressLine: z.string().min(5),
	addressExtra: z.string().optional().nullable(),
	provinceCode: z.number(),
	provinceName: z.string(),
	wardCode: z.number(),
	wardName: z.string(),
	isDefault: z.boolean().default(false),
});
export type AddressInput = z.infer<typeof AddressSchema>;

export const UpdateAddressSchema = AddressSchema.partial();
export type UpdateAddressInput = z.infer<typeof UpdateAddressSchema>;
