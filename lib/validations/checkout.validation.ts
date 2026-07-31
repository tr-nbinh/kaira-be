import { z } from "zod";

// Định nghĩa danh sách enum phương thức thanh toán khớp 100% với Prisma
const PaymentMethodEnum = z.enum(["cod", "vnpay", "momo", "stripe"]);

export const PlaceOrderSchema = z.object({
	email: z.string().regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/),
	note: z.string().max(500, { message: "Ghi chú không được vượt quá 500 ký tự" }).nullable().optional(),
	paymentMethod: PaymentMethodEnum,
	shippingAddress: z.object({
		fullName: z.string().min(2, { message: "Tên người nhận phải từ 2 ký tự trở lên" }).max(255),

		// Regex cơ bản kiểm tra số điện thoại Việt Nam (bắt đầu bằng 0 hoặc +84, theo sau là 9-10 chữ số)
		phone: z.string().regex(/^(0|\+84)[3|5|7|8|9][0-9]{8}$/, {
			message: "Số điện thoại không đúng định dạng Việt Nam",
		}),

		provinceCode: z.number().int().positive({ message: "Mã tỉnh/thành phố phải là số nguyên dương" }),
		provinceName: z.string().min(1, { message: "Tên tỉnh/thành phố là bắt buộc" }).max(100),
		wardCode: z.number().int().positive({ message: "Mã phường/xã phải là số nguyên dương" }),
		wardName: z.string().min(1, { message: "Tên phường/xã là bắt buộc" }).max(100),
		addressLine: z.string().min(5, { message: "Địa chỉ chi tiết phải từ 5 ký tự trở lên" }).max(500),
		addressExtra: z.string().max(50, { message: "Thông tin bổ sung tối đa 50 ký tự" }).nullable().optional(),
	}),
});

// Xuất bản Type từ Schema để dùng làm Type Hinting trong code
export type PlaceOrderInput = z.infer<typeof PlaceOrderSchema>;
