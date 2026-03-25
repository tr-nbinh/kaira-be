import { ERROR_CODES } from "@/constants/error-codes";
import { db } from "@/lib/db";
import { Blog, CreateBlogInput, UpdateBlogInput } from "@/models/blog.model";
import { PaginationResponse } from "@/models/paginatedResponse.model";
import { ApiError } from "../utils/api-error";

export const BlogService = {
	// 1. Lấy danh sách blog (có phân trang cơ bản)
	async getAll(limit = 10, page = 1): Promise<PaginationResponse<Blog>> {
		const [blogs, total] = await Promise.all([
			db.blogs.findMany({
				take: limit,
				skip: (page - 1) * limit,
				orderBy: { created_at: "desc" },
			}),
			db.blogs.count(),
		]);

		return {
			data: blogs as any,
			meta: {
				limit: limit,
				page: page,
				totalCount: total,
				totalPages: Math.ceil(total / limit),
			},
		};
	},

	// 2. Lấy chi tiết 1 blog qua Slug
	async getBySlug(slug: string) {
		const blog = await db.blogs.findUnique({
			where: { slug },
		});
		if (!blog) {
			throw new ApiError("Blog not found", 404, ERROR_CODES.BLOG_NOT_FOUND);
		}
		return blog;
	},

	// 3. Tạo mới blog
	async create(data: CreateBlogInput) {
		return await db.blogs.create({
			data: {
				...data,
				published_at: data.published_at ? new Date(data.published_at) : null,
			},
		});
	},

	// 4. Cập nhật blog
	async update(id: string, data: UpdateBlogInput) {
		return await db.blogs.update({
			where: { id },
			data: {
				...data,
				published_at: data.published_at ? new Date(data.published_at) : undefined,
			},
		});
	},

	// 5. Xóa blog
	async delete(id: string) {
		return await db.blogs.delete({
			where: { id },
		});
	},
};
