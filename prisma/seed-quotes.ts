import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const quotes = [
	{
		authorName: "The Quiet Observer",
		source: "TNB.Studio Journal",
		displayOrder: 1,
		translations: {
			en: "Style is not about being noticed. It is about being remembered.",
			vi: "Phong cách không phải để được chú ý. Mà là để được ghi nhớ.",
		},
	},
	{
		authorName: "Atelier No. 7",
		source: "TNB.Studio Journal",
		displayOrder: 2,
		translations: {
			en: "Elegance begins with the details no one else notices.",
			vi: "Sự thanh lịch bắt đầu từ những chi tiết mà không ai khác để ý.",
		},
	},
	{
		authorName: "The Style Journal",
		source: "TNB.Studio",
		displayOrder: 3,
		translations: {
			en: "What you wear becomes part of the story you tell without words.",
			vi: "Những gì bạn mặc trở thành một phần câu chuyện bạn kể mà không cần lời nói.",
		},
	},
	{
		authorName: "Maison TNB",
		source: "TNB.Studio",
		displayOrder: 4,
		translations: {
			en: "The most lasting style is the one that feels entirely your own.",
			vi: "Phong cách bền vững nhất là phong cách hoàn toàn thuộc về chính bạn.",
		},
	},
	{
		authorName: "TNB.Studio",
		source: "The TNB Journal",
		displayOrder: 5,
		translations: {
			en: "Wear what feels true to you, and let the rest become your signature.",
			vi: "Hãy mặc những gì chân thật với bạn, rồi để phần còn lại trở thành dấu ấn riêng.",
		},
	},
];

async function main() {
	console.log("🌱 Start seeding quotes...");

	for (const quote of quotes) {
		await prisma.quote.create({
			data: {
				authorName: quote.authorName,
				source: quote.source,
				displayOrder: quote.displayOrder,
				isActive: true,

				translations: {
					create: [
						{
							languageCode: "en",
							content: quote.translations.en,
						},
						{
							languageCode: "vi",
							content: quote.translations.vi,
						},
					],
				},
			},
		});

		console.log(`✅ Created: ${quote.authorName}`);
	}

	console.log("🎉 Quotes seeding completed successfully!");
}

main()
	.catch((error) => {
		console.error("❌ Seeding failed:", error);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
