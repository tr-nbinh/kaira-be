import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
	const TARGET_PRODUCT_ID = "91d69e07-c85a-4775-874f-1d1141a5908a";

	console.log("🌱 Bắt đầu seed Measurement Specification...");

	const keyComposition = await prisma.specificationKey.upsert({
		where: { code: "composition" },
		update: {},
		create: {
			code: "composition",
			sortOrder: 1,
			translations: {
				create: [
					{ languageCode: "en", title: "Composition" },
					{ languageCode: "vi", title: "Thành phần" },
				],
			},
		},
	});

	// 1. Tạo hoặc lấy Key "measurement" (Từ điển Tên thông số)
	const keyMeasurement = await prisma.specificationKey.upsert({
		where: { code: "measurement" },
		update: {},
		create: {
			code: "measurement",
			sortOrder: 2,
			translations: {
				create: [
					{ languageCode: "en", title: "Measurement" },
					{ languageCode: "vi", title: "Kích thước" },
				],
			},
		},
	});

	const keySustainability = await prisma.specificationKey.upsert({
		where: { code: "sustainability" },
		update: {},
		create: {
			code: "sustainability",
			sortOrder: 2,
			translations: {
				create: [
					{ languageCode: "en", title: "Sustainability" },
					{ languageCode: "vi", title: "Tính bền vững" },
				],
			},
		},
	});

	// 2. Gán Measurement cho Sản phẩm chỉ định bằng customValue (JSON)
	// Lưu ý: Đối với Measurement (số đo riêng của từng sản phẩm), ta đặt valueId = null
	// và lưu giá trị trực tiếp vào customValue dạng JSON đa ngôn ngữ.
	await prisma.productSpecification.create({
		data: {
			productId: TARGET_PRODUCT_ID,
			keyId: keyMeasurement.id,
			valueId: null,
			customValue: {
				en: "Strap length (min) : 42 cm, Strap length (max) : 46 cm, Shoulder strap drop : 47.5 cm",
				vi: "Chiều dài dây đeo (tối thiểu): 42 cm, Chiều dài dây đeo (tối đa): 46 cm, Độ rơi dây đeo vai: 47.5 cm",
			},
		},
	});

	await prisma.productSpecification.create({
		data: {
			productId: TARGET_PRODUCT_ID,
			keyId: keyComposition.id,
			valueId: null,
			customValue: {
				en: "100%brass",
				vi: "100% đồng thau",
			},
		},
	});

	// await prisma.productSpecification.create({
	// 	data: {
	// 		productId: "e06df802-cc17-422e-8465-db37a687f974",
	// 		keyId: "9b8c340a-0003-407b-b822-244a5fa6056f",
	// 		valueId: "6ea44c9c-61c1-42be-a260-2329f260b21c",
	// 	},
	// });

	// await prisma.specificationValue.create({
	// 	data: {
	// 		keyId: keySustainability.id,
	// 		sortOrder: 0,

	// 		translations: {
	// 			create: [
	// 				{
	// 					languageCode: "en",
	// 					label: "Denim made with organic cotton and Bananatex®, a plant-based and plastic-free material made of abacà fibers derived from plants cultivated within a natural ecosystem of sustainable forestry.",
	// 				},
	// 				{
	// 					languageCode: "vi",
	// 					label: "Vải denim được làm từ cotton hữu cơ và Bananatex® — một loại vật liệu có nguồn gốc thực vật, không chứa nhựa, được sản xuất từ sợi abacà lấy từ những cây trồng trong hệ sinh thái rừng tự nhiên theo hướng bền vững.",
	// 				},
	// 			],
	// 		},
	// 	},
	// });

	console.log(`✅ Seed thành công Measurement cho Product ID: ${TARGET_PRODUCT_ID}`);
}

main()
	.catch((e) => {
		console.error("❌ Lỗi khi seed data:", e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
