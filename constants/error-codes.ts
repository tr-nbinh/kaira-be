export const ERROR_CODES = {
	// Blog Errors
	BLOG_NOT_FOUND: "BLOG_NOT_FOUND",
	BLOG_ALREADY_EXISTS: "BLOG_ALREADY_EXISTS",
	BLOG_IS_DRAFT: "BLOG_IS_DRAFT",
	INVALID_SLUG: "INVALID_SLUG",

	// Auth Errors (Nếu có)
	UNAUTHORIZED: "UNAUTHORIZED",
	FORBIDDEN: "FORBIDDEN",

	// System Errors
	INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
	VALIDATION_ERROR: "VALIDATION_ERROR",
} as const;

// Tạo type để dùng trong TypeScript (giúp gợi ý code)
export type ErrorCode = keyof typeof ERROR_CODES;
