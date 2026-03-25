import { BlogService } from "@/lib/services/blog.service";
import { sendSuccess } from "@/lib/utils/api-response";
import { handleApiError } from "@/lib/utils/handleError";
import { BlogParamsSchema } from "@/lib/validations/blog.validation";

interface RouteParams {
	slug: string;
}

export async function GET(req: Request, { params }: { params: Promise<RouteParams> }) {
	try {
		const { slug } = await params;
		const validatedSlug = BlogParamsSchema.parse({ slug });
		const data = await BlogService.getBySlug(validatedSlug.slug);
		return sendSuccess(data, "Get blog successfully");
	} catch (error) {
		return handleApiError(error);
	}
}
