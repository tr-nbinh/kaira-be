import { NextRequest } from "next/server";

export function getAuthenticatedUserId(req: NextRequest): number | undefined {
	const userIdHeader = req.headers.get("X-User-Id");
	return userIdHeader ? parseInt(userIdHeader, 10) : undefined;
    
}
