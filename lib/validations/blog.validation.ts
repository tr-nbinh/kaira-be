import { BLOG_STATUS } from "@/models/blog.model";
import { z } from "zod";

export const slugSchema = z
	.string()
	.min(5, "Slug quá ngắn")
	.max(255, "Slug quá dài")
	.regex(/^[a-z0-9-]+$/, "Slug chỉ được chứa chữ thường, số và dấu gạch ngang");

export const CreateBlogSchema = z.object({
	title: z.string().max(255),
	slug: slugSchema,
	excerpt: z.string().max(255),
	content: z.string(),
	thumbnail_url: z.url().or(z.literal("")),
	author_id: z.uuid(),
	status: z.enum(BLOG_STATUS).optional().default("published"),
	published_at: z.iso.datetime().optional().nullable(),
});

export const BlogParamsSchema = z.object({
	slug: slugSchema,
});
