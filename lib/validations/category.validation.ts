import { z } from "zod";

// Regex kiểm tra từng segment trong slug:
// - Chỉ chấp nhận chữ cái thường (a-z), số (0-9), và dấu gạch ngang (-)
// - Các segment phân cách nhau bằng dấu phẩy '/'
// - Không bắt đầu hoặc kết thúc bằng dấu '/'
// - Không chứa 2 dấu '//' liên tiếp
const SLUG_PATH_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/;

// Danh sách các từ khóa cấm/trùng với static routes
const RESERVED_PATHS = ["cart", "checkout", "account", "auth", "search", "wishlist", "api", "404"];

export const CategoryPathSchema = z
	.string()
	.trim()
	.min(1, "Category path không được để trống")
	.max(200, "Category path không được vượt quá 200 ký tự")
	// Bỏ bớt dấu / ở 2 đầu nếu lỡ dính vào (ví dụ: "/women/top/" -> "women/top")
	.transform((path) => path.replace(/^\/+|\/+$/g, ""))
	// Kiểm tra định dạng regex
	.refine((path) => SLUG_PATH_REGEX.test(path), {
		message: 'Category path không hợp lệ (chỉ chứa chữ cái thường, số, dấu "-" và phân cách bằng "/")',
	})
	// Kiểm tra không trùng với các trang hệ thống cố định
	.refine(
		(path) => {
			const firstSegment = path.split("/")[0].toLowerCase();
			return !RESERVED_PATHS.includes(firstSegment);
		},
		{
			message: "Category path chứa từ khóa trùng với trang hệ thống",
		},
	);

// Export type để dùng trong TypeScript
export type CategoryPathInput = z.infer<typeof CategoryPathSchema>;
