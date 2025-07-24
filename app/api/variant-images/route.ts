import cloudinary from "@/lib/cloudinary";
import { handleApiError } from "@/lib/utils/handleError";

export const config = {
	api: {
		bodyParser: false,
	},
};

export async function POST(req: Request) {
	try {
		const formData = await req.formData();

		let imageFiles = formData.getAll("images");


		const filesToUpload = imageFiles.filter((item) => item instanceof File) as File[];

		if (filesToUpload.length === 0) {
			return new Response(JSON.stringify({ message: "Không có tệp nào được tải lên." }), { status: 400 });
		}

		// const uploadedImages = [];
		// for (const imageFile of filesToUpload) {
		// 	// Chuyển đổi File object thành Buffer để Cloudinary có thể upload
		// 	const arrayBuffer = await imageFile.arrayBuffer();
		// 	const buffer = Buffer.from(arrayBuffer);

		// 	// Upload buffer trực tiếp lên Cloudinary.
		// 	// Sử dụng data URI để truyền buffer: `data:<mime-type>;base64,<base64-encoded-data>`
		// 	const cloudinaryUploadResult = await cloudinary.uploader.upload(
		// 		`data:${imageFile.type};base64,${buffer.toString("base64")}`,
		// 		{
		// 			folder: "nextjs-product-variant-images",
		// 			// Tùy chọn: resource_type: "auto" để Cloudinary tự động phát hiện loại tệp
		// 		}
		// 	);
		// 	uploadedImages.push({
		// 		image_url: cloudinaryUploadResult.secure_url,
		// 		public_id: cloudinaryUploadResult.public_id,
		// 	});
		// 	// Không cần fs.unlinkSync vì không có tệp tạm thời được tạo trên đĩa.
		// 	// Dữ liệu được xử lý trong bộ nhớ (buffer).
		// }

		// Nếu bạn có các trường dữ liệu khác trong form (ví dụ: product name), bạn có thể lấy chúng:
		// const productName = formData.get('productName');
		// console.log("Product Name:", productName);

		return Response.json({
			message: "Đã upload thành công tất cả ảnh lên Cloudinary!",
			images: filesToUpload,
		});
	} catch (error) {
		return handleApiError(error);
	}
}
