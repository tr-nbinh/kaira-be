// app/api/send-email/route.ts
import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
	// Lấy dữ liệu từ body của request
	const { email } = await req.json();

	// Kiểm tra xem các biến môi trường đã được tải chưa
	if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
		return NextResponse.json(
			{ message: "Email credentials are not set in environment variables." },
			{ status: 500 }
		);
	}

	try {
		const transporter = nodemailer.createTransport({
			host: "smtp.gmail.com", // Máy chủ SMTP của Gmail
			port: 465, // Cổng SSL/TLS
			secure: true, // Sử dụng SSL/TLS
			auth: {
				user: process.env.EMAIL_USER, // Địa chỉ email của bạn
				pass: process.env.EMAIL_PASS, // Mật khẩu ứng dụng của bạn
			},
		});

		// 2. Định nghĩa nội dung email
		const mailOptions = {
			from: process.env.EMAIL_USER,
			to: email,
			subject: "Xác thực tài khoản của bạn",
			html: `<p>Vui lòng nhấp vào đường link sau để xác thực tài khoản của bạn:</p>
           <a href="http://localhost:3000/api/auth/verify?token=abcdefgh-123311-aqwaxhaqsd">Xác thực tài khoản</a>`,
		};

		// 3. Gửi email
		await transporter.sendMail(mailOptions);

		// Trả về phản hồi thành công
		return NextResponse.json({ message: "Email sent successfully!" });
	} catch (error: any) {
		console.error("Error sending email:", error);
		// Trả về phản hồi lỗi
		return NextResponse.json({ message: "Failed to send email.", error: error.message }, { status: 500 });
	}
}
