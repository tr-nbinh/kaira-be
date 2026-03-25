import { BlogService } from "@/lib/services/blog.service";
import { sendSuccess } from "@/lib/utils/api-response";
import { handleApiError } from "@/lib/utils/handleError";
import { CreateBlogSchema } from "@/lib/validations/blog.validation";

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const validatedData = CreateBlogSchema.parse(body);
		const data = await BlogService.create(validatedData);
		return sendSuccess(data, "Create blog successfully");
	} catch (error) {
		return handleApiError(error);
	}
}

export async function GET(req: Request) {
	try {
		const { searchParams } = new URL(req.url);
		const page = Number(searchParams.get("page")) || 1;
		const limit = Number(searchParams.get("limit")) || 10;
		const data = await BlogService.getAll(limit, page);
		return sendSuccess(data, "Get blogs successfully");
	} catch (error) {
		return handleApiError(error);
	}
}
