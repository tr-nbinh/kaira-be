import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const pool = new Pool({
	host: process.env.PG_HOST,
	port: process.env.PG_PORT ? parseInt(process.env.PG_PORT, 10) : 5432,
	user: process.env.PG_USER,
	password: process.env.PG_PASSWORD,
	database: process.env.PG_DATABASE,
	ssl: {
		rejectUnauthorized: false, // Cần thiết cho một số nhà cung cấp hosting nếu không có CA cert
	},
});

export default pool;

export async function query(text: any, params?: any) {
	const client = await pool.connect();
	try {
		const res = await client.query(text, params);
		return res.rows; // trả về chỉ các hàng dữ liệu
	} finally {
		client.release(); // luôn luôn giải phóng client trở lại pool
	}
}

const globalForPrisma = globalThis as unknown as {
	prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
	globalForPrisma.prisma = db;
}
