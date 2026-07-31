// app/api/blogs/route.ts
import { db } from "@/lib/db";
import { getLocaleFromRequest } from "@/lib/helpers/api-i18n-context";
import { sendSuccess } from "@/lib/utils/api-response";
import { handleApiError } from "@/lib/utils/handleError";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	try {
		const lang = getLocaleFromRequest(request);
		const { searchParams } = new URL(request.url);
		const categoryCode = searchParams.get("category");
		const isFeaturedParam = searchParams.get("featured");
		const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
		const limit = Math.max(1, parseInt(searchParams.get("limit") || "10", 10));
		const skip = (page - 1) * limit;

		// Build db `where` clause
		const whereClause: any = {
			status: "published",
		};

		if (categoryCode) {
			whereClause.category = {
				code: categoryCode,
			};
		}

		if (isFeaturedParam !== null) {
			whereClause.isFeatured = isFeaturedParam === "true";
		}

		// Query DB song song (Total count + Items)
		const [totalItems, posts] = await Promise.all([
			db.blogPost.count({ where: whereClause }),
			db.blogPost.findMany({
				where: whereClause,
				skip,
				take: limit,
				orderBy: {
					publishedAt: "desc",
				},
				select: {
					id: true,
					coverImage: true,
					coverAlt: true,
					readTime: true,
					isFeatured: true,
					publishedAt: true,
					authorName: true,
					authorAvatar: true,
					category: {
						select: {
							code: true,
							translations: {
								where: { languageCode: lang },
								select: { name: true },
							},
						},
					},
					translations: {
						where: { languageCode: lang },
						select: {
							title: true,
							slug: true,
							description: true,
						},
					},
				},
			}),
		]);

		// Format dữ liệu đầu ra gọn gàng cho Frontend
		const formattedPosts = posts.map((post) => {
			const translation = post.translations[0] || {};
			const categoryTranslation = post.category.translations[0] || {};

			return {
				id: post.id,
				title: translation.title || "",
				slug: translation.slug || "",
				description: translation.description || "",
				coverImage: post.coverImage,
				coverAlt: post.coverAlt,
				readTime: post.readTime,
				isFeatured: post.isFeatured,
				publishedAt: post.publishedAt,
				author: {
					name: post.authorName,
					avatar: post.authorAvatar,
				},
				category: {
					code: post.category.code,
					name: categoryTranslation.name || post.category.code,
				},
			};
		});

		return sendSuccess({
			data: formattedPosts,
			meta: { page, limit, totalCount: totalItems, totalPages: Math.ceil(totalItems / limit) },
		});
	} catch (error) {
		console.error("Error fetching blog list:", error);
		return handleApiError(error);
	}
}
