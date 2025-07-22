export interface ApiResponse<T = any> {
	success?: boolean;
	statusCode?: number;
	message: string;
	data?: T;
}

export interface ApiError<T = any> {
	message: string;
	status?: number;
	data?: T;
	raw?: any;
}
