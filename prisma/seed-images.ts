import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
	console.log("🌱 Start seeding product images...");

	// =====================================================
	// 1. Tìm product
	// =====================================================

	const productTranslation = await prisma.product_translations.findUnique({
		where: {
			slug: "fendi-baby-b",
		},
		select: {
			product_id: true,
		},
	});

	if (!productTranslation) {
		throw new Error("❌ Product essential-cotton-top not found");
	}

	const productId = productTranslation.product_id;

	// =====================================================
	// 2. Tìm color attribute
	// =====================================================

	const colorAttribute = await prisma.attributes.findUnique({
		where: {
			slug: "color",
		},
		select: {
			id: true,
		},
	});

	if (!colorAttribute) {
		throw new Error("❌ Color attribute not found");
	}

	// =====================================================
	// 3. Tìm Grey
	// =====================================================

	const green = await prisma.attribute_values.findFirst({
		where: {
			attribute_id: colorAttribute.id,
			value_code: "#599560",
		},
	});

	if (!green) {
		throw new Error("❌ Grey color not found");
	}

	// =====================================================
	// 4. Tìm Black
	// =====================================================

	const yellow = await prisma.attribute_values.findFirst({
		where: {
			attribute_id: colorAttribute.id,
			value_code: "#F6E03D",
		},
	});

	if (!yellow) {
		throw new Error("❌ Black color not found");
	}

	const orange = await prisma.attribute_values.findFirst({
		where: {
			attribute_id: colorAttribute.id,
			value_code: "#DD850F",
		},
	});

	if (!orange) {
		throw new Error("❌ Black color not found");
	}

	// =====================================================
	// 5. Tạo ảnh Green
	// =====================================================

	await prisma.productImage.createMany({
		data: [
			{
				productId,
				attributeValueId: orange.id,
				publicId: "women_bag_100_wwsr84",
				url: "https://res.cloudinary.com/dt9djaztc/image/upload/v1785303383/women_bag_100_wwsr84.jpg",
				width: 800,
				height: 1000,
				format: "jpg",
				is_main: true,
				is_hover: false,
				displayOrder: 1,
			},
			{
				productId,
				attributeValueId: orange.id,
				publicId: "women_bag_101_ktvktx",
				url: "https://res.cloudinary.com/dt9djaztc/image/upload/v1785303383/women_bag_101_ktvktx.jpg",
				width: 800,
				height: 1000,
				format: "jpg",
				is_main: false,
				is_hover: true,
				displayOrder: 2,
			},
			{
				productId,
				attributeValueId: orange.id,
				publicId: "women_bag_99_ifbdbo",
				url: "https://res.cloudinary.com/dt9djaztc/image/upload/v1785303383/women_bag_99_ifbdbo.jpg",
				width: 800,
				height: 1000,
				format: "jpg",
				is_main: false,
				is_hover: false,
				displayOrder: 3,
			},
			// {
			// 	productId,
			// 	attributeValueId: be.id,
			// 	publicId: "women_bottoms_13_zzsq7q",
			// 	url: "https://res.cloudinary.com/dt9djaztc/image/upload/v1785250253/women_bottoms_13_zzsq7q.jpg",
			// 	width: 800,
			// 	height: 1000,
			// 	format: "jpg",
			// 	is_main: false,
			// 	is_hover: false,
			// 	displayOrder: 4,
			// },
		],
	});

	// =====================================================
	// 6. Tạo ảnh Black
	// =====================================================

	await prisma.productImage.createMany({
		data: [
			{
				productId,
				attributeValueId: yellow.id,
				publicId: "women_bag_107_ngxgwu",
				url: "https://res.cloudinary.com/dt9djaztc/image/upload/v1785303382/women_bag_107_ngxgwu.jpg",
				width: 800,
				height: 1000,
				format: "jpg",
				is_main: true,
				is_hover: false,
				displayOrder: 1,
			},
			{
				productId,
				attributeValueId: yellow.id,
				publicId: "women_bag_109_sainro",
				url: "https://res.cloudinary.com/dt9djaztc/image/upload/v1785303383/women_bag_109_sainro.jpg",
				width: 800,
				height: 1000,
				format: "jpg",
				is_main: false,
				is_hover: true,
				displayOrder: 2,
			},
			{
				productId,
				attributeValueId: yellow.id,
				publicId: "women_bag_108_zdw14u",
				url: "https://res.cloudinary.com/dt9djaztc/image/upload/v1785303383/women_bag_108_zdw14u.jpg",
				width: 800,
				height: 1000,
				format: "jpg",
				is_main: false,
				is_hover: false,
				displayOrder: 3,
			},
			{
				productId,
				attributeValueId: yellow.id,
				publicId: "women_bag_106_eusacb",
				url: "https://res.cloudinary.com/dt9djaztc/image/upload/v1785303383/women_bag_106_eusacb.jpg",
				width: 800,
				height: 1000,
				format: "jpg",
				is_main: false,
				is_hover: false,
				displayOrder: 4,
			},
		],
	});

	await prisma.productImage.createMany({
		data: [
			{
				productId,
				attributeValueId: green.id,
				publicId: "women_bag_114_z10adp",
				url: "https://res.cloudinary.com/dt9djaztc/image/upload/v1785303383/women_bag_114_z10adp.jpg",
				width: 800,
				height: 1000,
				format: "jpg",
				is_main: true,
				is_hover: false,
				displayOrder: 1,
			},
			{
				productId,
				attributeValueId: green.id,
				publicId: "women_bag_115_rsxyzl",
				url: "https://res.cloudinary.com/dt9djaztc/image/upload/v1785303382/women_bag_115_rsxyzl.jpg",
				width: 800,
				height: 1000,
				format: "jpg",
				is_main: false,
				is_hover: true,
				displayOrder: 2,
			},
			{
				productId,
				attributeValueId: green.id,
				publicId: "women_bag_113_unopym",
				url: "https://res.cloudinary.com/dt9djaztc/image/upload/v1785303384/women_bag_113_unopym.jpg",
				width: 800,
				height: 1000,
				format: "jpg",
				is_main: false,
				is_hover: false,
				displayOrder: 3,
			},
		],
	});

	console.log("✅ Grey images created");
	console.log("✅ Black images created");
	console.log("🎉 Product images seeding completed!");
}

main()
	.catch((error) => {
		console.error("❌ Seeding failed:", error);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
