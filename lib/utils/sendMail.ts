// lib/email.ts
import nodemailer from "nodemailer";

type SendEmailOptions = {
	to: string;
	subject: string;
	html: string;
};

// Tạo transporter SMTP (ví dụ với Gmail SMTP)
const transporter = nodemailer.createTransport({
	host: 'smtp.gmail.com',
	port: 465,
	secure: true, // true nếu dùng port 465
	auth: {
		user: process.env.EMAIL_USER,
		pass: process.env.EMAIL_PASS,
	},
});

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
