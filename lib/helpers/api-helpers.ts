// lib/api-helpers.ts

import { ApiResponse } from "@/types/api-respone";

export function response<T>(options: ApiResponse<T>, status: number = 200) {
	return Response.json(options, { status });
}

export function serverErrorResponse(message: string, details?: any) {
	const apiResponse: ApiResponse = { message };
	return Response.json(apiResponse, { status: 500 });
}
