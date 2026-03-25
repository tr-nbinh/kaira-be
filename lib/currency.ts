export async function getVndToUsdRate(): Promise<number> {
	try {
		const response = await fetch("https://open.er-api.com/v6/latest/VND", {
			next: { revalidate: 86400 },
		});
		if (!response.ok) throw new Error("Failed to fetch exchange rate");
		const data = await response.json();
		// data.rates.USD sẽ là con số ví dụ: 0.00003937
		return data.rates.USD;
	} catch (error) {
		console.error("Exchange Rate Error:", error);
		return 1 / 25400;
	}
}
