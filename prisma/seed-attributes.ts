import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
	console.log("🌱 Start seeding color attribute...");

	// 1. Tạo attribute Color
	const colorAttribute = await prisma.attributes.upsert({
		where: {
			slug: "color",
		},
		update: {
			display_type: "text",
		},
		create: {
			slug: "color",
			display_type: "text",
		},
	});

	console.log("✅ Attribute created:", colorAttribute.slug);

	// 2. Tạo translations cho Color
	await prisma.attribute_translations.upsert({
		where: {
			attribute_id_language_code: {
				attribute_id: colorAttribute.id,
				language_code: "en",
			},
		},
		update: {
			name: "Color",
		},
		create: {
			attribute_id: colorAttribute.id,
			language_code: "en",
			name: "Color",
		},
	});

	await prisma.attribute_translations.upsert({
		where: {
			attribute_id_language_code: {
				attribute_id: colorAttribute.id,
				language_code: "vi",
			},
		},
		update: {
			name: "Màu sắc",
		},
		create: {
			attribute_id: colorAttribute.id,
			language_code: "vi",
			name: "Màu sắc",
		},
	});

	// 3. Tạo Be
	const gold = await prisma.attribute_values.create({
		data: {
			attribute_id: colorAttribute.id,
			value_code: "#E6CC88",
			sort_order: 10,

			attribute_value_translations: {
				create: [
					{
						language_code: "en",
						name: "Gold",
					},
					{
						language_code: "vi",
						name: "Vàng kim",
					},
				],
			},
		},
	});

	// const yellow = await prisma.attribute_values.create({
	// 	data: {
	// 		attribute_id: colorAttribute.id,
	// 		value_code: "#F6E03D",
	// 		sort_order: 7,

	// 		attribute_value_translations: {
	// 			create: [
	// 				{
	// 					language_code: "en",
	// 					name: "Orange",
	// 				},
	// 				{
	// 					language_code: "vi",
	// 					name: "Cam",
	// 				},
	// 			],
	// 		},
	// 	},
	// });

	console.log("✅ Created Grey:", gold.value_code);

	console.log("🎉 Color attribute seeding completed!");
}

main()
	.catch((error) => {
		console.error("❌ Seeding failed:", error);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
