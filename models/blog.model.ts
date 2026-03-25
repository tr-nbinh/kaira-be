import { CreateBlogSchema } from "@/lib/validations/blog.validation";
import { z } from "zod";

// Trích xuất Type từ Zod Schema
export type CreateBlogInput = z.infer<typeof CreateBlogSchema>;
export type UpdateBlogInput = Partial<z.infer<typeof CreateBlogSchema>>;

export const BLOG_STATUS = ["draft", "published"] as const;
export type BlogStatus = (typeof BLOG_STATUS)[number];

export interface Blog {
	id: string;
	title: string;
	slug: string;
	excerpt?: string;
	content: string;
	thumbnail_url: string;
	author_id?: number;
	status: BlogStatus;
	view_count: number;
	created_at?: Date;
	updated_at?: Date;
	published_at?: Date;
}
