import { HomeCategory } from "@/types/home-category.interface";
import { db } from "../db";
import { ApiError } from "../utils/api-error";

type CategoryNode = {
	id: string;
	name: string | null;
	slug: string | null;
	path: string | null;
	children: CategoryNode[];
};

export const CategoryService = {
	async getCategories(locale: string) {
		const categories = await db.category.findMany({
			where: {
				is_active: true,
			},
			orderBy: {
				sort_order: "asc",
			},
			select: {
				id: true,
				parent_id: true,

				translations: {
					where: {
						languageCode: locale,
					},
					select: {
						name: true,
						slug: true,
						path: true,
					},
				},
			},
		});

		const paths: string[] = [];
		const categoryMap = new Map<string, CategoryNode>();
		for (const category of categories) {
			const translation = category.translations[0];
			if (translation.path) {
				paths.push(translation.path);
			}

			categoryMap.set(category.id, {
				id: category.id,
				name: translation?.name ?? null,
				slug: translation?.slug ?? null,
				path: translation?.path ?? null,
				children: [],
			});
		}

		const rootCategories: CategoryNode[] = [];
		for (const category of categories) {
			const currentCategory = categoryMap.get(category.id)!;

			if (!category.parent_id) {
				rootCategories.push(currentCategory);
				continue;
			}

			const parentCategory = categoryMap.get(category.parent_id);

			if (parentCategory) {
				parentCategory.children.push(currentCategory);
			}
		}

		return { categories: rootCategories, paths };

		// const paths: string[] = [];
		// const buildCategoryUrls = (categories: CategoryNode[], parentPath = "") => {
		// 	for (const category of categories) {
		// 		const currentPath = `${parentPath}/${category.slug}`;

		// 		if (category.children.length === 0) {
		// 			category.url = currentPath;
		// 			paths.push(currentPath);
		// 		} else {
		// 			buildCategoryUrls(category.children, currentPath);
		// 		}
		// 	}
		// };

		// buildCategoryUrls(rootCategories);
		// return { categories: rootCategories, paths };
	},

	async getHomepageCategories(locale: string) {
		const homepageCategories = await db.homepageCategory.findMany({
			where: {
				isActive: true,
				category: {
					is_active: true,
				},
			},

			orderBy: {
				position: "asc",
			},

			include: {
				category: {
					include: {
						translations: {
							where: {
								languageCode: locale,
							},
						},
					},
				},
			},
		});

		const response: HomeCategory[] = homepageCategories.map((item: any) => {
			const translation = item.category.translations[0];

			return {
				id: item.id,
				categoryId: item.categoryId,
				position: item.position,

				imageUrl: item.category.imageUrl,
				imagePublicId: item.category.image_public_id,

				name: translation?.name ?? "",
				slug: translation?.slug ?? "",
				description: translation?.description ?? "",

				createdAt: item.createdAt,
				updatedAt: item.updatedAt,
			};
		});

		return response;
	},
};
