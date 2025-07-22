import { notFound } from "next/navigation";

export const locales = ["en", "vi"] as const; // Sử dụng 'as const' cho kiểu tuple cụ thể
export type Locale = (typeof locales)[number]; // Kiểu Locale: "en" | "vi"
export const defaultLocale: Locale = "en";

// --- Kiểu cho hàm dịch thuật (Translation Function) ---
export type TranslationFunction = (key: string, variables?: Record<string, string | number>) => string;

// --- Cache cho các hàm dịch thuật đã được tải và làm phẳng ---
// Map<Locale, Promise<TranslationFunction>> để xử lý bất đồng bộ và tránh race condition
const translationFunctionCache = new Map<Locale, Promise<TranslationFunction>>();

/**
 * Hàm nội bộ để làm phẳng các đối tượng tin nhắn lồng nhau.
 * Ví dụ: { auth: { login: { success: "..." } } }  -> { "auth.login.success": "..." }
 * @param nestedMessages Đối tượng tin nhắn lồng nhau.
 * @param prefix Tiền tố cho các key (dùng cho đệ quy).
 * @returns Đối tượng phẳng với các key dạng dot-notation.
 */
const flattenMessages = (nestedMessages: any, prefix = ""): Record<string, string> => {
	return Object.keys(nestedMessages).reduce((acc, key) => {
		const value = nestedMessages[key];
		const prefixedKey = prefix ? `${prefix}.${key}` : key;
		if (typeof value === "object" && value !== null && !Array.isArray(value)) {
			// Nếu là đối tượng và không phải mảng, tiếp tục đệ quy để làm phẳng
			Object.assign(acc, flattenMessages(value, prefixedKey));
		} else {
			// Nếu là giá trị cuối cùng, thêm vào đối tượng phẳng
			acc[prefixedKey] = value;
		}
		return acc;
	}, {} as Record<string, string>); // Khởi tạo accumulator là một Record<string, string> rỗng
};

/**
 * Tải các tin nhắn dịch thuật cho một locale cụ thể từ file JSON.
 * @param locale Ngôn ngữ cần tải tin nhắn.
 * @returns Dữ liệu tin nhắn đã được tải.
 * @throws Lỗi nếu không thể tải tin nhắn.
 */
export async function getMessagesForLocale(locale: string): Promise<any> {
	if (!locales.includes(locale as Locale)) {
		locale = defaultLocale;
	}

	try {
		return (await import(`./messages/${locale}.json`)).default;
	} catch (error) {
		console.error(`Could not load messages for locale ${locale}:`, error);
		throw new Error(`Failed to load translation messages for locale: ${locale}`);
	}
}

/**
 * Lấy hàm dịch thuật (t) cho API, có tích hợp caching để tối ưu hiệu suất.
 * Hàm 't' này hoạt động với các key dạng dot-notation nhờ vào bước làm phẳng tin nhắn.
 * @param locale Ngôn ngữ cần hàm dịch thuật.
 * @returns Hàm dịch thuật (TranslationFunction).
 */
export async function getTranslationsForApi(locale: Locale): Promise<TranslationFunction> {
	if (translationFunctionCache.has(locale)) {
		return translationFunctionCache.get(locale)!;
	}

	const translationPromise = (async (): Promise<TranslationFunction> => {
		let messages: any;
		try {
			messages = await getMessagesForLocale(locale);
		} catch (error) {
			console.error(`Failed to get messages for locale ${locale}, returning fallback 't' function.`);
			return (key: string) => key;
		}

		const flattened = flattenMessages(messages);

		return (key: string, variables?: Record<string, string | number>) => {
			// Lấy chuỗi dịch từ đối tượng phẳng, hoặc trả về key nếu không tìm thấy
			let text = flattened[key] || key;

			// Thực hiện nội suy biến nếu có
			if (variables) {
				for (const [varKey, varValue] of Object.entries(variables)) {
					// Thay thế {varKey} bằng giá trị tương ứng
					text = text.replace(`{${varKey}}`, String(varValue));
				}
			}
			return text;
		};
	})();

	translationFunctionCache.set(locale, translationPromise);
	return translationPromise;
}
