import { ApiResponse } from "@/types/api-respone";

export function sendSuccess<T>(data: T, message: string = "Success", status: number = 200) {
	const response: ApiResponse<T> = {
		success: true,
		message,
		data,
	};

	return Response.json(response, { status });
}
