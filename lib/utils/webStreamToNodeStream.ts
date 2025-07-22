// src/lib/utils/webStreamToNodeStream.ts
import { Readable } from "stream";

/**
 * Chuyển đổi một Web ReadableStream (từ Web Standard Request.body) thành một Node.js Readable stream.
 * Formidable và các thư viện xử lý multipart/form-data khác trong Node.js thường yêu cầu Node.js stream.
 * @param webStream ReadableStream từ request.body
 * @returns Node.js Readable stream
 */
export function webStreamToNodeStream(webStream: ReadableStream<Uint8Array>): Readable {
	// Tạo một Node.js Readable stream
	const nodeStream = new Readable({
		objectMode: true,
		read() {}, // Phương thức read là bắt buộc nhưng có thể để trống vì chúng ta sẽ push dữ liệu
	});

	// Lấy reader từ Web ReadableStream để đọc từng chunk
	const reader = webStream.getReader();

	// Bắt đầu bơm dữ liệu từ Web stream vào Node.js stream
	function pump() {
		reader
			.read()
			.then(({ done, value }) => {
				if (done) {
					// Khi Web stream kết thúc, kết thúc Node.js stream
					nodeStream.push(null);
					return;
				}
				// Đẩy chunk dữ liệu vào Node.js stream
				nodeStream.push(value);
				// Tiếp tục bơm
				pump();
			})
			.catch((err) => {
				// Xử lý lỗi nếu có trong quá trình đọc stream
				nodeStream.emit("error", err);
			});
	}

	pump(); // Bắt đầu quá trình bơm dữ liệu
	return nodeStream;
}
