import { RequestInfo } from "@/models/request-info.model";
import { userAgent } from "next/server";

export function getRequestInfo(req: Request): RequestInfo {
	const ua = userAgent(req);

	const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "unknown";

	return {
		ip,
		userAgent: ua.ua,
	};
}
