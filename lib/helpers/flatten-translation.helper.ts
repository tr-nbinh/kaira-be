/**
 * Helper để làm phẳng cấu trúc Translation của Prisma
 * @param data: Dữ liệu từ Prisma (Object hoặc Array)
 * @param languageCode: Mã ngôn ngữ muốn lấy (vi, en...)
 */
export function flattenTranslation<T extends { translations: any[] }>(data: T | T[], languageCode: string) {
	const transform = (item: T) => {
		// Tìm bản dịch khớp với languageCode, nếu không thấy thì lấy bản dịch đầu tiên
		const translation = item.translations.find((t) => t.languageCode === languageCode) || item.translations[0];

		// Loại bỏ mảng translations gốc và gộp các trường đã dịch vào
		const { translations, ...rest } = item;

		return {
			...rest,
			...translation,
		};
	};

	return Array.isArray(data) ? data.map(transform) : transform(data);
}
