export interface PaginatedResponse<T> {
	data: T[];
	page: number;
	limit: number;
	totalPages: number;
	totalCount: number;
}

export interface PaginationResponse<T> {
	data: T[];
	meta: PaginationMeta;
}

export interface PaginationMeta {
	page: number;
	limit: number;
	totalPages: number;
	totalCount: number;
}
