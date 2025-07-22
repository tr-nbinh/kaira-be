// lib/utils/handleError.ts
export function handleApiError(err: unknown) {
	return Response.json({ message: "Internal Server Error", error: (err as Error).message }, { status: 500 });
}
