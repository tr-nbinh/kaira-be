// lib/email.ts
import nodemailer from "nodemailer";
import path from "path";
import fs from "fs/promises";

type SendEmailOptions = {
	to: string;
	subject: string;
	html: string;
};

// Tạo transporter SMTP (ví dụ với Gmail SMTP)
const transporter = nodemailer.createTransport({
	host: "smtp.gmail.com",
	port: 465,
	secure: true, // true nếu dùng port 465
	auth: {
		user: process.env.EMAIL_USER,
		pass: process.env.EMAIL_PASS,
	},
});

export const renderEmailTemplate = async (fileName: string, variables: Record<string, string>) => {
	const filePath = path.join(process.cwd(), "email", "templates", fileName);
	let html = await fs.readFile(filePath, "utf-8");

	for (const key in variables) {
		html = html.replaceAll(`{{${key}}}`, variables[key]);
	}

	return html;
};

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
	try {
		const info = await transporter.sendMail({
			from: process.env.EMAIL_USER,
			to,
			subject,
			html,
		});

		return { success: true };
	} catch (error) {
		console.error("❌ Gửi email thất bại:", error);
		return { success: false, error };
	}
}
