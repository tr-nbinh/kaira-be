export interface PaginatedResponse<T> {
	data: T[];
	totalCount: number;
	page: number;
	limit: number;
    totalPages: number;
}
