export interface ProductResponse {
	id: number;
	name: string;
	description: string | null;
	isFavorite: boolean;
	price: string;
	imageUrl: string;
	slug: string;
}

export interface PriceRange {
	min?: number;
	max?: number;
}

export interface GetProductsOptions {
	lang?: string;
	categoryIds?: number[];
	colorIds?: number[];
	sizeIds?: number[];
	brandIds?: number[];
	bestSeller?: boolean;
	bestReviewed?: boolean;
	isNewArrival?: boolean;
	priceRanges?: PriceRange[];
	page?: number;
	limit?: number;
}
