import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const collectionSeeds = [
	{
		image: "https://res.cloudinary.com/dt9djaztc/image/upload/v1785389430/1783517578963-hp-corpo_kbocsj.avif",
		publicId: "1783517578963-hp-corpo_kbocsj",
		featured: true,
		overlayClass: "bg-black/40",
		translations: [
			{
				languageCode: "vi",
				name: "Bộ Sưu Tập Thu - Đông 2026",
				slug: "/hang-moi-ve",
				description:
					"Lấy cảm hứng từ nắng vàng và biển xanh, bộ sưu tập mang lại sự thoải mái, phóng khoáng với chất liệu Linen cao cấp.",
			},
			{
				languageCode: "en",
				name: "Fall - Winter Collection 2026",
				slug: "new-arrivals",
				description:
					"Inspired by golden sunshine and blue seas, offering comfort and freedom with premium linen fabrics.",
			},
		],
	},
	{
		image: "https://res.cloudinary.com/dt9djaztc/image/upload/v1785389483/1778071236526-signatures-hpcorpo-d-5760x2520-n5_2520x5760_vbukwf.avif",
		publicId: "1778071236526-signatures-hpcorpo-d-5760x2520-n5_2520x5760_vbukwf",
		featured: false,
		overlayClass: "bg-slate-900/60",
		translations: [
			{
				languageCode: "vi",
				name: "Coco Crush",
				slug: "nu/phu-kien",
				description:
					"Những đường cắt may tinh tế, gam màu trung tính dành riêng cho người yêu thích phong cách Coded Minimalist.",
			},
			{
				languageCode: "en",
				name: "Coco Crush",
				slug: "women/accessories",
				description:
					"Sophisticated tailoring and neutral tones tailored for lovers of the Coded Minimalist aesthetic.",
			},
		],
	},
	{
		image: "https://res.cloudinary.com/dt9djaztc/image/upload/v1785389708/1774013960756-homepage-corpo-one-desktop-1-new_1260x2880_xltq99.webp",
		publicId: "1774013960756-homepage-corpo-one-desktop-1-new_1260x2880_xltq99",
		featured: false,
		overlayClass: "bg-neutral-800/30",
		translations: [
			{
				languageCode: "vi",
				name: "Bộ sưu tập Métiers d'Art 2026",
				slug: "nam/quan-ao/ao-khoac",
				description:
					"Năng động và cá tính với các thiết kế Denim, T-shirt oversize ứng dụng cao cho mọi hoạt động.",
			},
			{
				languageCode: "en",
				name: "Metiers Art 2026 Collection",
				slug: "men/clothing/jackets-coats",
				description: "Dynamic and expressive featuring highly versatile denim and oversized tee designs.",
			},
		],
	},
];

async function main() {
	console.log("🌱 Đang seed dữ liệu Collections...");

	for (const item of collectionSeeds) {
		await prisma.collection.create({
			data: {
				image: item.image,
				publicId: item.publicId,
				featured: item.featured,
				overlayClass: item.overlayClass,

				collectionTranslations: {
					create: item.translations, // Tạo luôn các bản dịch tương ứng
				},
			},
		});
	}

	console.log("✅ Seed dữ liệu Collection thành công!");
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
