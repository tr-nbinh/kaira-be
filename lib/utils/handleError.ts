import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { ApiError } from "./api-error";

export function handleApiError(error: unknown) {
	console.error("[API_ERROR]:", error);

	if (error instanceof ZodError) {
		return Response.json(
			{
				error: "Dữ liệu không hợp lệ",
				details: error.issues.map((e) => ({
					field: e.path.join("."),
					message: e.message,
				})),
			},
			{ status: 402 },
		);
	}

	if (error instanceof Prisma.PrismaClientKnownRequestError) {
		if (error.code === "P2002") {
			const target = (error.meta?.target as string[]) || [];
			return Response.json(
				{
					error: "Dữ liệu đã tồn tại",
					message: `Trường (${target.join(", ")}) bị trùng lặp.`,
					code: error.code,
				},
				{ status: 409 },
			);
		}

		return Response.json(
			{ success: false, message: error.meta?.cause || error.message.split("\n").pop() },
			{ status: 400 },
		);
	}

	if (error instanceof Prisma.PrismaClientInitializationError) {
		return Response.json({ success: false, message: error.cause || error.message.split("\n").pop() });
	}

	const err = error as ApiError;
	return Response.json(
		{ success: false, message: err.message || "Internal Server Error", code: err.code, data: err.data },
		{ status: err.status || 500 },
	);
}
