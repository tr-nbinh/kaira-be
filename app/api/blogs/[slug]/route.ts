import { db } from "@/lib/db";
import { getLocaleFromRequest } from "@/lib/helpers/api-i18n-context";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
	try {
		const { slug } = await params;
		const { searchParams } = new URL(request.url);
		const lang = getLocaleFromRequest(request);

		// 1. Tìm BlogPostTranslation khớp với slug & languageCode
		const translation = await db.blogPostTranslation.findFirst({
			where: {
				slug: slug,
				languageCode: lang,
			},
			select: {
				title: true,
				slug: true,
				description: true,
				contentHtml: true,
				post: {
					select: {
						id: true,
						coverImage: true,
						coverAlt: true,
						readTime: true,
						isFeatured: true,
						publishedAt: true,
						authorName: true,
						authorAvatar: true,
						status: true,
						category: {
							select: {
								code: true,
								translations: {
									where: { languageCode: lang },
									select: { name: true },
								},
							},
						},
						relatedProducts: {
							orderBy: { sortOrder: "asc" },
							select: {
								sortOrder: true,
								product: {
									select: {
										id: true,
										product_translations: {
											where: { language_code: lang },
											select: {
												name: true,
												description: true,
											},
										},
									},
								},
							},
						},
					},
				},
			},
		});

		if (!translation || translation.post.status !== "published") {
			return NextResponse.json({ success: false, message: "Blog post not found" }, { status: 404 });
		}

		const post = translation.post;
		const categoryTranslation = post.category.translations[0] || {};

		// 2. Format dữ liệu trả về cho Frontend
		const formattedPost = {
			id: post.id,
			title: translation.title,
			slug: translation.slug,
			description: translation.description,
			contentHtml: translation.contentHtml,
			coverImage: post.coverImage,
			coverAlt: post.coverAlt,
			readTime: post.readTime,
			publishedAt: post.publishedAt,
			author: {
				name: post.authorName,
				avatar: post.authorAvatar,
			},
			category: {
				code: post.category.code,
				name: categoryTranslation.name || post.category.code,
			},
			// Danh sách sản phẩm Shop The Look
			relatedProducts: post.relatedProducts.map((rp) => {
				const prodTrans = rp.product.product_translations[0] || {};
				return {
					id: rp.product.id,
					name: prodTrans.name || "",
					description: prodTrans.description || "",
					sortOrder: rp.sortOrder,
				};
			}),
		};

		return NextResponse.json({
			success: true,
			data: formattedPost,
		});
	} catch (error) {
		console.error("Error fetching blog detail:", error);
		return NextResponse.json({ success: false, message: "Failed to fetch blog detail" }, { status: 500 });
	}
}
