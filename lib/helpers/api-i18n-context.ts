import { getTranslationsForApi, defaultLocale, locales, TranslationFunction, Locale } from "@/i18n";

interface ApiI18nContext {
	t: TranslationFunction;
	locale: Locale;
}

export function getLocaleFromRequest(request: Request): Locale {
	const acceptLanguageHeader = request.headers.get("Accept-Language");
	const preferredLocale = acceptLanguageHeader
		? (acceptLanguageHeader.split(",")[0].split("-")[0].toLowerCase() as Locale)
		: defaultLocale;

	return locales.includes(preferredLocale) ? preferredLocale : defaultLocale;
}

export async function getApiI18nContext(request: Request): Promise<ApiI18nContext> {
	const locale = getLocaleFromRequest(request);

	let t: TranslationFunction;
	try {
		t = await getTranslationsForApi(locale);
	} catch (translationError) {
		console.error(`Error loading translations for API: ${translationError}`);
		// Ném lỗi để API route handler gọi nó có thể bắt và xử lý
		throw new Error("Failed to load translations for the request.");
	}

	return { t, locale };
}
