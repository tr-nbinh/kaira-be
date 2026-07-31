import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type CategoryData = {
	vi: {
		name: string;
		slug: string;
		description?: string;
		path?: string;
	};
	en: {
		name: string;
		slug: string;
		description?: string;
		path?: string;
	};
	children?: CategoryData[];
};

const categories: CategoryData[] = [
	{
		vi: {
			name: "Nữ",
			slug: "nu",
			description: "Thời trang dành cho nữ",
		},
		en: {
			name: "Women",
			slug: "women",
			description: "Fashion for women",
		},
		children: [
			{
				vi: {
					name: "Quần áo",
					slug: "quan-ao",
				},
				en: {
					name: "Clothing",
					slug: "clothing",
				},
				children: [
					{
						vi: {
							name: "Váy",
							slug: "vay",
							path: "/nu/quan-ao/vay",
						},
						en: {
							name: "Dresses",
							slug: "dresses",
							path: "/women/clothing/dresses",
						},
					},
					{
						vi: {
							name: "Áo",
							slug: "ao",
							path: "/nu/quan-ao/ao",
						},
						en: {
							name: "Tops",
							slug: "tops",
							path: "/women/clothing/tops",
						},
					},
					{
						vi: {
							name: "Quần",
							slug: "quan",
							path: "/nu/quan-ao/quan",
						},
						en: {
							name: "Bottoms",
							slug: "bottoms",
							path: "/women/clothing/bottoms",
						},
					},
					{
						vi: {
							name: "Áo khoác",
							slug: "ao-khoac",
							path: "/nu/quan-ao/ao-khoac",
						},
						en: {
							name: "Jackets & Coats",
							slug: "jackets-coats",
							path: "/women/clothing/jackets-coats",
						},
					},
				],
			},
			{
				vi: {
					name: "Giày",
					slug: "giay",
					path: "/nu/giay",
				},
				en: {
					name: "Shoes",
					slug: "shoes",
					path: "/women/shoes",
				},
			},
			{
				vi: {
					name: "Túi xách",
					slug: "tui-xach",
					path: "/nu/tui-xach",
				},
				en: {
					name: "Bags",
					slug: "bags",
					path: "/women/bags",
				},
			},
			{
				vi: {
					name: "Phụ kiện",
					slug: "phu-kien",
					path: "/nu/phu-kien",
				},
				en: {
					name: "Accessories",
					slug: "accessories",
					path: "/women/accessories",
				},
			},
		],
	},

	{
		vi: {
			name: "Nam",
			slug: "nam",
			description: "Thời trang dành cho nam",
		},
		en: {
			name: "Men",
			slug: "men",
			description: "Fashion for men",
		},
		children: [
			{
				vi: {
					name: "Quần áo",
					slug: "quan-ao",
				},
				en: {
					name: "Clothing",
					slug: "clothing",
				},
				children: [
					{
						vi: {
							name: "Áo thun",
							slug: "ao-thun",
							path: "/nam/quan-ao/ao-thun",
						},
						en: {
							name: "T-Shirts",
							slug: "t-shirts",
							path: "/men/clothing/t-shirts",
						},
					},
					{
						vi: {
							name: "Áo sơ mi",
							slug: "ao-so-mi",
							path: "/nam/quan-ao/ao-so-mi",
						},
						en: {
							name: "Shirts",
							slug: "shirts",
							path: "/men/clothing/shirts",
						},
					},
					{
						vi: {
							name: "Quần",
							slug: "quan",
							path: "/nam/quan-ao/quan",
						},
						en: {
							name: "Pants",
							slug: "pants",
							path: "/men/clothing/pants",
						},
					},
					{
						vi: {
							name: "Áo khoác",
							slug: "ao-khoac",
							path: "/nam/quan-ao/ao-khoac",
						},
						en: {
							name: "Jackets & Coats",
							slug: "jackets-coats",
							path: "/men/clothing/jackets-coats",
						},
					},
				],
			},
			{
				vi: {
					name: "Giày",
					slug: "giay",
					path: "/nam/giay",
				},
				en: {
					name: "Shoes",
					slug: "shoes",
					path: "/men/shoes",
				},
			},
			{
				vi: {
					name: "Túi xách",
					slug: "tui-xach",
					path: "/nam/tui-xach",
				},
				en: {
					name: "Bags",
					slug: "bags",
					path: "/men/bags",
				},
			},
			{
				vi: {
					name: "Phụ kiện",
					slug: "phu-kien",
					path: "/nam/phu-kien",
				},
				en: {
					name: "Accessories",
					slug: "accessories",
					path: "/men/accessories",
				},
			},
		],
	},

	{
		vi: {
			name: "Trẻ em",
			slug: "tre-em",
			description: "Thời trang dành cho trẻ em",
		},
		en: {
			name: "Kids",
			slug: "kids",
			description: "Fashion for kids",
		},
		children: [
			{
				vi: {
					name: "Quần áo",
					slug: "quan-ao",
					path: "/tre-em/quan-ao",
				},
				en: {
					name: "Clothing",
					slug: "clothing",
					path: "/kids/clothing",
				},
			},
			{
				vi: {
					name: "Giày",
					slug: "giay",
					path: "/tre-em/giay",
				},
				en: {
					name: "Shoes",
					slug: "shoes",
					path: "/kids/shoes",
				},
			},
			{
				vi: {
					name: "Phụ kiện",
					slug: "phu-kien",
					path: "/tre-em/phu-kien",
				},
				en: {
					name: "Accessories",
					slug: "accessories",
					path: "/kids/accessories",
				},
			},
		],
	},

	{
		vi: {
			name: "Hàng mới về",
			slug: "hang-moi-ve",
			path: "/hang-moi-ve",
			description: "Những sản phẩm mới nhất",
		},
		en: {
			name: "New Arrivals",
			slug: "new-arrivals",
			path: "/new-arrivals",
			description: "The latest products",
		},
	},

	{
		vi: {
			name: "Khuyến mãi",
			slug: "khuyen-mai",
			path: "/khuyen-mai",
			description: "Các sản phẩm đang được giảm giá",
		},
		en: {
			name: "Sale",
			slug: "sale",
			path: "/sale",
			description: "Products currently on sale",
		},
	},
];

async function createCategory(category: CategoryData, parentId: string | null = null, sortOrder = 0) {
	const createdCategory = await prisma.category.create({
		data: {
			parent_id: parentId,
			sort_order: sortOrder,
			is_active: true,

			translations: {
				create: [
					{
						languageCode: "vi",
						name: category.vi.name,
						slug: category.vi.slug,
						description: category.vi.description,
						path: category.vi.path,
					},
					{
						languageCode: "en",
						name: category.en.name,
						slug: category.en.slug,
						description: category.en.description,
						path: category.en.path,
					},
				],
			},
		},
	});

	console.log(`✅ Created: ${category.en.name}`);

	if (category.children) {
		for (const [index, child] of category.children.entries()) {
			await createCategory(child, createdCategory.id, index + 1);
		}
	}

	return createdCategory;
}

async function main() {
	console.log("🌱 Start seeding...");

	await prisma.languages.upsert({
		where: {
			code: "vi",
		},
		update: {},
		create: {
			code: "vi",
			name: "Vietnam",
		},
	});

	await prisma.languages.upsert({
		where: {
			code: "en",
		},
		update: {},
		create: {
			code: "en",
			name: "English",
		},
	});

	console.log("✅ Languages seeded");

	console.log("🌱 Start seeding categories...");

	for (const [index, category] of categories.entries()) {
		await createCategory(category, null, index + 1);
	}

	console.log("🎉 Categories seeding completed successfully!");
}

main()
	.catch((error) => {
		console.error("❌ Seeding failed:", error);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
