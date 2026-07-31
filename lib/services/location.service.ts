export const locationService = {
	async getProvinces() {
		const res = await fetch(`${[process.env.PROVINCES_API_URL]}/p`, {
			next: { revalidate: 86400 }, // cache 1 ngày
		});

		const data = await res.json();
		return data;
	},

	async getWardsByProvinceCode(provinceCode: number) {
		const res = await fetch(`${[process.env.PROVINCES_API_URL]}/p/${provinceCode}?depth=2`);
		const data = await res.json();
		return data.wards;
	},
};
