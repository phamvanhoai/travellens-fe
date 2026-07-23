import type { Metadata } from "next";
import { LegalDocument, type LegalSection } from "@/components/legal/legal-document";

export const metadata: Metadata = {
  title: "Điều khoản sử dụng",
  description: "Các điều kiện áp dụng khi truy cập và sử dụng nền tảng TravelLens."
};

const sections: LegalSection[] = [
  { title: "Chấp nhận điều khoản", paragraphs: ["Khi truy cập, đăng ký hoặc sử dụng TravelLens, bạn xác nhận đã đọc, hiểu và đồng ý với Điều khoản sử dụng cùng Chính sách bảo mật. Nếu không đồng ý, bạn không nên tiếp tục sử dụng dịch vụ."] },
  { title: "Điều kiện tài khoản", items: ["Bạn phải cung cấp thông tin chính xác và cập nhật khi thông tin thay đổi.", "Bạn chịu trách nhiệm bảo mật thông tin đăng nhập và mọi hoạt động hợp lệ phát sinh từ tài khoản.", "Không được mua bán, cho thuê, mạo danh hoặc sử dụng tài khoản của người khác khi chưa được phép.", "TravelLens có thể yêu cầu xác minh, tạm khóa hoặc chấm dứt tài khoản khi phát hiện rủi ro, gian lận hoặc vi phạm."] },
  { title: "Đặt tour và lịch khởi hành", paragraphs: ["Mỗi booking gắn với một lịch khởi hành cụ thể, sức chứa và mức giá hiển thị tại thời điểm xác nhận. Booking chỉ có hiệu lực theo trạng thái được TravelLens ghi nhận. Bạn có trách nhiệm kiểm tra tour, ngày giờ, số hành khách, điểm tập trung, yêu cầu sức khỏe và thông tin liên hệ trước khi thanh toán."] },
  { title: "Giá, thanh toán và mã giảm giá", items: ["Giá được hiển thị bằng đơn vị tiền tệ ghi trên nền tảng và có thể thay đổi giữa các lịch khởi hành.", "Thanh toán phải được thực hiện qua phương thức được hỗ trợ; trạng thái thành công trên TravelLens là căn cứ xác nhận.", "Mã giảm giá chịu điều kiện về thời hạn, giá trị tối thiểu, giới hạn sử dụng và mức giảm tối đa.", "Không được lợi dụng lỗi giá, lỗi coupon, thanh toán trùng hoặc cơ chế kỹ thuật để thu lợi không hợp lệ."] },
  { title: "Hủy booking và hoàn tiền", paragraphs: ["Quyền hủy, thời hạn hủy, phí và số tiền hoàn phụ thuộc chính sách được hiển thị hoặc chấp nhận tại thời điểm đặt tour. Booking đã thanh toán có thể cần nhân viên kiểm tra và xử lý hoàn tiền thủ công. Thời gian tiền về tài khoản còn phụ thuộc ngân hàng hoặc nhà cung cấp thanh toán."] },
  { title: "Thay đổi và hủy lịch khởi hành", paragraphs: ["Nhà cung cấp có thể đóng bán hoặc thay đổi lịch vì thời tiết, an toàn, yêu cầu vận hành hoặc sự kiện bất khả kháng. Nếu lịch có booking bị ảnh hưởng, TravelLens hoặc nhà cung cấp sẽ thông báo phương án phù hợp như đổi lịch, dịch vụ thay thế hoặc hoàn tiền theo chính sách áp dụng."] },
  { title: "Nội dung cộng đồng", items: ["Bạn giữ quyền đối với nội dung hợp pháp do mình tạo nhưng cấp cho TravelLens quyền lưu trữ, hiển thị và phân phối nội dung trong phạm vi vận hành dịch vụ.", "Không đăng nội dung trái pháp luật, giả mạo, thù ghét, quấy rối, xâm phạm riêng tư, bản quyền hoặc chứa mã độc/spam.", "Đánh giá phải phản ánh trải nghiệm thật và không được trao đổi lấy lợi ích nhằm làm sai lệch xếp hạng.", "TravelLens có quyền ẩn, gỡ bỏ, hạn chế hoặc chuyển nội dung cho cơ quan có thẩm quyền khi cần thiết."] },
  { title: "Group Trips và tương tác giữa người dùng", paragraphs: ["Người tổ chức và thành viên Group Trips tự chịu trách nhiệm về thỏa thuận, hành vi và an toàn khi tương tác. TravelLens cung cấp công cụ kết nối nhưng không mặc nhiên là đơn vị tổ chức, bảo lãnh danh tính hoặc đảm bảo hành vi của mọi thành viên."] },
  { title: "AI, bản đồ và nội dung tham khảo", paragraphs: ["Gợi ý AI, tuyến đường, thời tiết, giá tham khảo, bản đồ và nội dung cộng đồng có thể không đầy đủ hoặc thay đổi theo thời gian. Đây không phải tư vấn pháp lý, y tế, tài chính hay cam kết dịch vụ. Bạn cần kiểm tra nguồn chính thức trước khi di chuyển hoặc mua dịch vụ."] },
  { title: "Hành vi bị cấm", items: ["Can thiệp, quét, khai thác lỗ hổng hoặc làm gián đoạn hệ thống.", "Dùng bot trái phép, thu thập dữ liệu hàng loạt hoặc vượt qua giới hạn truy cập.", "Gian lận thanh toán, coupon, hoàn tiền, đánh giá hoặc danh tính.", "Sử dụng TravelLens để vi phạm pháp luật hoặc quyền của tổ chức/cá nhân khác."] },
  { title: "Sở hữu trí tuệ", paragraphs: ["Tên TravelLens, giao diện, mã nguồn, thiết kế, nhãn hiệu và nội dung thuộc TravelLens hoặc bên cấp phép được pháp luật bảo vệ. Bạn chỉ được sử dụng trong phạm vi dịch vụ cho mục đích cá nhân hợp pháp, trừ khi có thỏa thuận bằng văn bản khác."] },
  { title: "Giới hạn trách nhiệm", paragraphs: ["Trong phạm vi pháp luật cho phép, TravelLens không chịu trách nhiệm cho thiệt hại gián tiếp phát sinh từ thông tin do bên thứ ba cung cấp, hành vi người dùng, sự kiện bất khả kháng hoặc việc bạn không tuân thủ hướng dẫn an toàn. Quyền lợi bắt buộc của người tiêu dùng theo pháp luật vẫn được tôn trọng."] },
  { title: "Thay đổi và chấm dứt", paragraphs: ["TravelLens có thể cập nhật tính năng hoặc điều khoản. Phiên bản mới được công bố cùng ngày hiệu lực. Chúng tôi có thể hạn chế hoặc chấm dứt quyền truy cập khi bạn vi phạm, gây rủi ro cho hệ thống hoặc theo yêu cầu pháp luật."] },
  { title: "Luật áp dụng và liên hệ", paragraphs: ["Điều khoản được giải thích theo pháp luật Việt Nam, trừ khi quy định bắt buộc khác áp dụng. Các bên ưu tiên giải quyết tranh chấp thông qua trao đổi thiện chí; bạn có thể liên hệ kênh hỗ trợ chính thức trên TravelLens để gửi yêu cầu."] }
];

export default function TermsOfUsePage() {
  return <LegalDocument eyebrow="Quy định nền tảng" title="Điều khoản sử dụng" summary="Điều khoản này quy định quyền, nghĩa vụ và các nguyên tắc khi bạn sử dụng TravelLens để khám phá nội dung, đặt tour và tương tác với cộng đồng." updated="23/07/2026" sections={sections} />;
}
