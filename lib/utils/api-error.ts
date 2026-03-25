export class ApiError extends Error {
	status: number;
	code?: string;
	constructor(message: string, status: number, code?: string) {
		super();
		this.message = message;
		this.status = status;
		this.code = code;
	}
}
