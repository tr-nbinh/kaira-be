export class ApiError extends Error {
	status: number;
	code?: string;
	data?: any;
	constructor(message: string, status: number, code?: string, data?: any) {
		super();
		this.message = message;
		this.status = status;
		this.code = code;
		this.data = data;
	}
}
