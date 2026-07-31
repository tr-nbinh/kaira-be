import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
	console.log("🌱 Start seeding size attribute...");

	// =====================================================
	// 1. Tạo hoặc lấy Size attribute
	// =====================================================

	const sizeAttribute = await prisma.attributes.upsert({
		where: {
			slug: "shoes-size",
		},
		update: {},
		create: {
			slug: "shoes-size",
			display_type: "text",

			attribute_translations: {
				create: [
					{
						language_code: "en",
						name: "Shoes size",
					},
					{
						language_code: "vi",
						name: "Kích thước giày",
					},
				],
			},
		},
	});

	console.log(`✅ Attribute ready: ${sizeAttribute.slug}`);

	// =====================================================
	// 2. Các size từ XXS đến XXXL
	// =====================================================

	const sizes = ["35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45"];

	// =====================================================
	// 3. Tạo attribute values
	// =====================================================

	for (const [index, size] of sizes.entries()) {
		const existingSize = await prisma.attribute_values.findFirst({
			where: {
				attribute_id: sizeAttribute.id,
				value_code: size,
			},
		});

		if (existingSize) {
			console.log(`⚠️ Size already exists: ${size}`);
			continue;
		}

		const attributeValue = await prisma.attribute_values.create({
			data: {
				attribute_id: sizeAttribute.id,
				value_code: size,
				sort_order: index + 1,

				attribute_value_translations: {
					create: [
						{
							language_code: "en",
							name: size,
						},
						{
							language_code: "vi",
							name: size,
						},
					],
				},
			},
		});

		console.log(`✅ Created size: ${attributeValue.value_code}`);
	}

	console.log("🎉 Size attribute seeding completed!");
}

main()
	.catch((error) => {
		console.error("❌ Seeding failed:", error);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
