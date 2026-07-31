import { PrismaClient, Prisma, product_status } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
	console.log("🌱 Start seeding product...");

	// =====================================================
	// 1. Tìm category women-tops
	// =====================================================

	const categoryTranslation = await prisma.categoryTranslation.findFirst({
		where: {
			path: "/nu/tui-xach",
			languageCode: "vi",
		},
		select: {
			id: true,
			categoryId: true,
		},
	});

	if (!categoryTranslation) {
		throw new Error("❌ Category women-tops not found");
	}

	// =====================================================
	// 2. Tìm color attribute
	// =====================================================

	const colorAttribute = await prisma.attributes.findUnique({
		where: {
			slug: "color",
		},
	});

	if (!colorAttribute) {
		throw new Error("❌ Color attribute not found");
	}

	// =====================================================
	// Tìm size attribute
	// =====================================================
	// const sizeIds = [
	// 	"616130e4-3def-48a3-82c7-06feb35bfa01",
	// 	"cb96917e-0fb7-4c1b-83a4-e0bd6c29b726",
	// 	"d4c85b9e-4343-480c-ae14-ef20fbb690c6",
	// 	"b71900a1-a302-415f-a70f-ea8b5f26e474",
	// 	"d5c867a7-24cb-40ed-9a6c-f5b5b6eac826",
	// 	"7e43455c-0622-4ee8-b095-51a9ed1a8910",
	// 	"432d51e3-8ea1-458b-a8e8-b55360ea49c3",
	// ];
	// const sizes = await prisma.attribute_values.findMany({
	// 	where: { id: { in: sizeIds } },
	// 	select: {
	// 		id: true,
	// 		value_code: true,
	// 	},
	// 	orderBy: { sort_order: "asc" },
	// });

	// =====================================================
	// 3. Tìm Grey
	// =====================================================

	const orange = await prisma.attribute_values.findFirst({
		where: {
			attribute_id: colorAttribute.id,
			value_code: "#DD850F",
		},
	});

	if (!orange) {
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

	const green = await prisma.attribute_values.findFirst({
		where: {
			attribute_id: colorAttribute.id,
			value_code: "#599560",
		},
	});

	if (!green) {
		throw new Error("❌ Black color not found");
	}

	// =====================================================
	// 5. Tìm Brand
	// =====================================================

	const brand = await prisma.brand.findFirst({
		where: {
			id: "8aae39fd-46d2-4229-8451-448187a952ef",
		},
	});

	if (!brand) {
		throw new Error("❌ Brand kaira not found. Please change the brand slug.");
	}

	// =====================================================
	// 6. Tạo Product
	// =====================================================
	// const variantsBlue = sizes.map((s, index) => {
	// 	const v = {
	// 		sku: `TRENCHCOAT-BLUE-${s.value_code}`,
	// 		option_value_ids: [blue.id, s.id],
	// 		price: new Prisma.Decimal("100000000"),
	// 		// compare_at_price: new Prisma.Decimal("39.99"),
	// 		stock: Math.floor(Math.random() * (56 - 2 + 1)) + 2,
	// 		status: "active" as product_status,
	// 		is_default: index == 0,
	// 	};

	// 	return v;
	// });

	// const variantsBe = sizes.map((s, index) => {
	// 	const v = {
	// 		sku: `VCOLIBRI-BLACK-${s.value_code}`,
	// 		option_value_ids: [be.id, s.id],
	// 		price: new Prisma.Decimal("100000000"),
	// 		// compare_at_price: new Prisma.Decimal("39.99"),
	// 		stock: Math.floor(Math.random() * (56 - 2 + 1)) + 2,
	// 		status: "active" as product_status,
	// 		is_default: index == 0,
	// 	};

	// 	return v;
	// });

	// const variants = variantsBlue.concat(variantsBe);
	const variants = [
		{
			sku: `FENDIBABYB-YELLOW`,
			option_value_ids: [yellow.id],
			price: new Prisma.Decimal("54400000"),
			// compare_at_price: new Prisma.Decimal("39.99"),
			stock: Math.floor(Math.random() * (56 - 2 + 1)) + 2,
			status: "active" as product_status,
			is_default: true,
		},
		{
			sku: `FENDIBABYB-ORANGE`,
			option_value_ids: [orange.id],
			price: new Prisma.Decimal("45000000"),
			// compare_at_price: new Prisma.Decimal("39.99"),
			stock: Math.floor(Math.random() * (56 - 2 + 1)) + 2,
			status: "active" as product_status,
			is_default: false,
		},
		{
			sku: `FENDIBABYB-GREEN`,
			option_value_ids: [orange.id],
			price: new Prisma.Decimal("55800000"),
			// compare_at_price: new Prisma.Decimal("39.99"),
			stock: Math.floor(Math.random() * (56 - 2 + 1)) + 2,
			status: "active" as product_status,
			is_default: false,
		},
	];

	const product = await prisma.products.create({
		data: {
			brand_id: brand.id,
			status: "active",
			is_best_seller: true,

			// -----------------------------------------------
			// Product translations
			// -----------------------------------------------
			product_translations: {
				create: [
					{
						language_code: "en",
						name: "Fendi Baby B.",
						slug: "fendi-baby-b",
						description: "Raffia-effect material mini-bag",
						content:
							"<p>Small Fendi Baby B. bag with a slim, contemporary design that can be worn under the arm.</p><p>Covered with three layers of natural-coloured raffia-effect material fringe, hand-dyed to create a light green faded effect. Embellished with a beige leather FF clasp and finished with hand-sewn light blue topstitches, an emblem of the iconic Selleria stitching handed down through generations of Fendi artisans since 1925.</p><p>Featuring a front flap, magnetic clasp and zip, internal compartment lined in light green fabric and gold-finish metalware.</p><p>Can be carried on the shoulder thanks to the beige leather shoulder strap, adjustable by the side buckles.</p><p>Holds a 6.2-inch smartphone, card holder, keys and lipstick.</p>",
					},
					{
						language_code: "vi",
						name: "Túi Fendi Baby B.",
						slug: "tui-fendi-baby-b",
						description: "Túi mini chất liệu giả raffia",
						content:
							"<p>Túi <strong>Fendi Baby B.</strong> cỡ nhỏ với thiết kế thanh mảnh, hiện đại, có thể đeo ôm sát dưới cánh tay.</p><p>Sản phẩm được phủ ba lớp chất liệu hiệu ứng raffia màu tự nhiên, nhuộm thủ công để tạo hiệu ứng chuyển sắc xanh lá nhạt. Điểm nhấn là khóa cài FF bằng da màu be cùng các đường chỉ may nổi màu xanh dương nhạt được khâu tay, tái hiện kỹ thuật khâu Selleria biểu tượng đã được các nghệ nhân FENDI gìn giữ và truyền lại qua nhiều thế hệ kể từ năm 1925.</p><p>Túi sở hữu nắp gập phía trước, khóa nam châm kết hợp khóa kéo, ngăn chứa bên trong được lót vải màu xanh lá nhạt và hoàn thiện với các chi tiết kim loại mạ vàng.</p><p>Dây đeo vai bằng da màu be có thể điều chỉnh thông qua khóa hai bên, mang đến cảm giác đeo thoải mái và linh hoạt.</p><p>Túi có thể chứa một điện thoại thông minh 6,2 inch, hộp đựng thẻ, chìa khóa và son môi.</p>",
					},
				],
			},

			// -----------------------------------------------
			// Category: women-tops
			// -----------------------------------------------
			product_categories: {
				create: {
					category_id: categoryTranslation.categoryId,
				},
			},

			// -----------------------------------------------
			// Variants
			// -----------------------------------------------
			product_variants: {
				create: variants,
			},
		},

		include: {
			product_translations: true,
			product_categories: true,
			product_variants: true,
		},
	});

	console.log("✅ Product created:", product.id);

	console.log("✅ Variants created:", product.product_variants.length);

	console.log("🎉 Product seeding completed successfully!");
}

main()
	.catch((error) => {
		console.error("❌ Seeding failed:", error);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
