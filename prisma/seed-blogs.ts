import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
	console.log("🌱 Bắt đầu seed dữ liệu Blog / Editorial...");

	console.log("🧹 Đang làm sạch dữ liệu blog cũ...");

	// 1. Lấy danh sách Product IDs hiện có trong DB để liên kết Shop The Look
	const existingProducts = await prisma.products.findMany({
		take: 10,
		select: { id: true },
	});

	if (existingProducts.length === 0) {
		console.warn("⚠️ Cảnh báo: Chưa có sản phẩm nào trong DB. Hãy seed Product trước khi seed BlogProducts!");
	}

	const pIds = existingProducts.map((p) => p.id);

	// 2. Định nghĩa danh sách Categories
	const categoriesData = [
		{
			code: "editorial",
			sortOrder: 1,
			translations: [
				{ languageCode: "en", name: "Editorial" },
				{ languageCode: "vi", name: "Editorial" },
			],
		},
		{
			code: "styling-guide",
			sortOrder: 2,
			translations: [
				{ languageCode: "en", name: "Styling Guide" },
				{ languageCode: "vi", name: "Mẹo Phối Đồ" },
			],
		},
		{
			code: "trends",
			sortOrder: 3,
			translations: [
				{ languageCode: "en", name: "Trends" },
				{ languageCode: "vi", name: "Xu Hướng" },
			],
		},
		{
			code: "craftsmanship",
			sortOrder: 4,
			translations: [
				{ languageCode: "en", name: "Craftsmanship" },
				{ languageCode: "vi", name: "Nghệ Thuật Cắt May" },
			],
		},
	];

	// Map lưu trữ Category ID sau khi tạo
	const createdCategoryMap = new Map<string, string>();

	for (const cat of categoriesData) {
		const category = await prisma.blogCategory.upsert({
			where: { code: cat.code },
			update: {},
			create: {
				code: cat.code,
				sortOrder: cat.sortOrder,
				translations: {
					create: cat.translations,
				},
			},
		});
		createdCategoryMap.set(cat.code, category.id);
	}

	console.log("✅ Created 4 Blog Categories");

	// 3. Định nghĩa danh sách Posts tương ứng đủ cho các Category
	const postsData = [
		// --- CATEGORY 1: EDITORIAL (Featured Hero Post) ---
		{
			categoryCode: "editorial",
			authorName: "KAIRA Atelier",
			authorAvatar:
				"https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop",
			coverImage: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1600&auto=format&fit=crop",
			coverAlt: "Minimalist High Fashion Suit",
			readTime: "05 Min",
			isFeatured: true,
			translations: [
				{
					languageCode: "en",
					title: "The Art of Tailoring: Minimalist Elegance & Architectural Lines",
					slug: "the-art-of-tailoring-minimalist-elegance",
					description:
						"Exploring contemporary tailoring principles through our latest collection. Where architectural lines meet timeless luxury.",
					contentHtml: `
            <p>In a world defined by fast fashion, <strong>Minimalism</strong> is a statement of lifestyle. Our latest tailoring collection focuses on sharp silhouettes, eliminating unnecessary details to let pure craftsmanship shine.</p>
            <h2>Architectural Silhouettes</h2>
            <p>A perfect blazer relies on shoulder structure and natural drape. Virgin wool blended with fine elastane offers flexibility without losing its iconic sharpness.</p>
            <blockquote>"True luxury hides in subtle stitching and the unmatched feel of premium fabric against skin."</blockquote>
          `,
				},
				{
					languageCode: "vi",
					title: "Nghệ Thuật Cắt May: Đường Nét Kiến Trúc & Vẻ Đẹp Tối Giản",
					slug: "nghe-thuat-cat-may-duong-net-kien-truc",
					description:
						"Khám phá triết lý cắt may đương đại qua bộ sưu tập mới nhất. Nơi đường nét kiến trúc tối giản tôn vinh vẻ đẹp vĩnh cửu.",
					contentHtml: `
            <p>Trong thế giới thời trang nhanh biến đổi từng ngày, tinh thần <strong>Minimalism</strong> không chỉ là một xu hướng – đó là một tuyên ngôn về phong cách sống. Những thiết kế cắt may mùa này tập trung vào cấu trúc phom dáng sắc nét.</p>
            <h2>Phom Dáng Cấu Trúc Đương Đại</h2>
            <p>Một chiếc Áo Blazer hoàn hảo không nằm ở những chi tiết trang trí phức tạp, mà đến từ đường cắt vai chuẩn xác và độ rủ tự nhiên của vải.</p>
            <blockquote>"Xa xỉ thực sự nằm ở sự tinh tế của từng mũi chỉ và cảm giác mềm mịn khi chạm vào làn da."</blockquote>
          `,
				},
			],
			productIndices: [0, 1, 2], // Lấy sản phẩm 0, 1, 2
		},

		// --- CATEGORY 2: STYLING GUIDE ---
		{
			categoryCode: "styling-guide",
			authorName: "Minh Anh - Head Stylist",
			authorAvatar:
				"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop",
			coverImage: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=1200&auto=format&fit=crop",
			coverAlt: "Styling Oversized Blazer",
			readTime: "04 Min",
			isFeatured: false,
			translations: [
				{
					languageCode: "en",
					title: "5 Ways To Style An Oversized Blazer This Season",
					slug: "5-ways-to-style-an-oversized-blazer",
					description:
						"Transform your oversized blazer from formal office attire into an effortless street style icon.",
					contentHtml: `
            <p>The oversized blazer remains an indispensable piece in every modern wardrobe. Here is how to master the proportion game.</p>
            <h2>1. Paired with High-Waisted Denim</h2>
            <p>Combine a structured beige blazer with straight-leg denim for a balanced semi-casual look.</p>
          `,
				},
				{
					languageCode: "vi",
					title: "5 Cách Phối Đồ Với Áo Blazer Oversized Chuẩn High-Fashion",
					slug: "5-cach-phoi-do-voi-ao-blazer-oversized",
					description:
						"Bí quyết biến hóa chiếc blazer phom rộng từ phong cách công sở sang trọng đến vẻ ngoài dạo phố phóng khoáng.",
					contentHtml: `
            <p>Áo blazer oversized vẫn là món đồ "must-have" không thể thiếu. Dưới đây là cách làm chủ tỷ lệ trang phục đỉnh cao.</p>
            <h2>1. Kết Hợp Cùng Quần Jeans Cạp Cao</h2>
            <p>Sự kết hợp giữa phom dáng cứng cáp của blazer và chất liệu denim phóng khoáng tạo nên tổng thể vừa thanh lịch vừa năng động.</p>
          `,
				},
			],
			productIndices: [0, 3],
		},

		// --- CATEGORY 3: TRENDS ---
		{
			categoryCode: "trends",
			authorName: "KAIRA Editorial Team",
			authorAvatar:
				"https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop",
			coverImage: "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1200&auto=format&fit=crop",
			coverAlt: "Monochrome Black and White Style",
			readTime: "03 Min",
			isFeatured: false,
			translations: [
				{
					languageCode: "en",
					title: "Monochrome Palette: The Power of Black & White",
					slug: "monochrome-palette-black-and-white",
					description: "Explore the visual impact of stark contrast in monochrome dressing.",
					contentHtml: `
            <p>Black and white is not a lack of color; it is the ultimate expression of form and texture.</p>
          `,
				},
				{
					languageCode: "vi",
					title: "Monochrome: Sức Hút Từ Hai Gam Màu Đen & Trắng",
					slug: "monochrome-suc-hut-tu-hai-gam-mau-den-trang",
					description:
						"Tối giản không có nghĩa là đơn điệu. Cách kết hợp hai gam màu đối lập để tạo hiệu ứng thị giác mạnh mẽ.",
					contentHtml: `
            <p>Đen và Trắng không phải là sự thiếu hụt màu sắc, mà là đỉnh cao của hình khối và bề mặt chất liệu.</p>
          `,
				},
			],
			productIndices: [1, 4],
		},

		// --- CATEGORY 4: CRAFTSMANSHIP ---
		{
			categoryCode: "craftsmanship",
			authorName: "Master Tailor Group",
			authorAvatar:
				"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=300&auto=format&fit=crop",
			coverImage: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200&auto=format&fit=crop",
			coverAlt: "Fine Fabric Tailoring",
			readTime: "06 Min",
			isFeatured: false,
			translations: [
				{
					languageCode: "en",
					title: "Sustainable Luxury: The Virgin Wool Journey",
					slug: "sustainable-luxury-virgin-wool",
					description: "Unveiling the artisanal process behind our signature organic virgin wool garments.",
					contentHtml: `
            <p>Every garment tells a story of ethical sourcing, precision spinning, and hand-finished seams.</p>
          `,
				},
				{
					languageCode: "vi",
					title: "Hành Trình Của Vải Dạ Len Tự Nhiên & Thời Trang Bền Vũng",
					slug: "hanh-trinh-cua-vai-da-len-tu-nhien",
					description:
						"Tìm hiểu quy trình sản xuất thủ công tỉ mỉ đằng sau những thiết kế dạ len cao cấp của KAIRA.",
					contentHtml: `
            <p>Mỗi sản phẩm là một câu chuyện về nguồn nguyên liệu bền vững, kỹ thuật dệt tinh xảo và những đường may thủ công chuẩn xác.</p>
          `,
				},
			],
			productIndices: [2, 3, 5],
		},
	];

	// 4. Tạo Posts & Gán Products liên kết
	for (const postData of postsData) {
		const categoryId = createdCategoryMap.get(postData.categoryCode)!;

		// Tạo BlogPost + Translations
		const createdPost = await prisma.blogPost.create({
			data: {
				categoryId,
				authorName: postData.authorName,
				authorAvatar: postData.authorAvatar,
				coverImage: postData.coverImage,
				coverAlt: postData.coverAlt,
				readTime: postData.readTime,
				isFeatured: postData.isFeatured,
				status: "published",
				publishedAt: new Date(),
				translations: {
					create: postData.translations,
				},
			},
		});

		// Tạo liên kết Shop The Look (BlogPostProduct) nếu có sản phẩm trong DB
		if (pIds.length > 0) {
			// 🎯 Lấy productId và dùng Set để LOẠI BỎ ID TRÙNG LẶP trong cùng 1 post
			const rawProductIds = postData.productIndices.map((index) => pIds[index % pIds.length]).filter(Boolean);

			const uniqueProductIds = Array.from(new Set(rawProductIds));

			for (let i = 0; i < uniqueProductIds.length; i++) {
				await prisma.blogPostProduct.create({
					data: {
						postId: createdPost.id,
						productId: uniqueProductIds[i],
						sortOrder: i + 1,
					},
				});
			}
		}
	}

	console.log("✅ Seed thành công 4 bài viết đầy đủ cho các Categories!");
}

main()
	.catch((e) => {
		console.error("❌ Lỗi khi seed Blog:", e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
