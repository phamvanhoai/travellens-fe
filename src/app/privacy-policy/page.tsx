import type { Metadata } from "next";
import { LegalDocument, type LegalSection } from "@/components/legal/legal-document";

export const metadata: Metadata = {
  title: "Chính sách bảo mật",
  description: "Chính sách thu thập, sử dụng và bảo vệ dữ liệu cá nhân của TravelLens."
};

const sections: LegalSection[] = [
  { title: "Phạm vi áp dụng", paragraphs: ["Chính sách này giải thích cách TravelLens thu thập, sử dụng, lưu trữ và bảo vệ thông tin khi bạn truy cập nền tảng, tạo tài khoản, đặt tour, thanh toán, đăng nội dung cộng đồng hoặc sử dụng trợ lý du lịch AI."] },
  { title: "Thông tin chúng tôi thu thập", items: ["Thông tin tài khoản như họ tên, email, số điện thoại, ảnh đại diện và thông tin xác thực.", "Thông tin đặt tour như lịch khởi hành, hành khách, yêu cầu đặc biệt, mã booking và lịch sử hủy/hoàn tiền.", "Thông tin giao dịch và trạng thái thanh toán. TravelLens không chủ động lưu toàn bộ dữ liệu thẻ thanh toán.", "Nội dung bạn đăng tải như bài viết, bình luận, đánh giá, hình ảnh, hành trình nhóm và báo cáo vi phạm.", "Dữ liệu kỹ thuật như địa chỉ IP, loại thiết bị, trình duyệt, nhật ký truy cập, cookie và dữ liệu chẩn đoán.", "Vị trí chỉ được xử lý khi bạn cho phép hoặc chủ động gắn vị trí vào nội dung."] },
  { title: "Mục đích sử dụng", items: ["Cung cấp, xác nhận và quản lý booking, thanh toán, hủy tour và hoàn tiền.", "Cá nhân hóa gợi ý điểm đến, tour và nội dung du lịch.", "Vận hành Travel Feed, Group Trips, đánh giá, bản đồ và trải nghiệm 360.", "Phát hiện gian lận, bảo vệ tài khoản, xử lý báo cáo và thực thi quy định cộng đồng.", "Gửi thông báo giao dịch, hỗ trợ khách hàng và thông tin dịch vụ quan trọng.", "Phân tích hiệu suất để cải thiện độ ổn định, an toàn và trải nghiệm người dùng."] },
  { title: "Trợ lý du lịch AI", paragraphs: ["Nội dung bạn nhập vào trợ lý AI có thể được xử lý để tạo câu trả lời và đề xuất hành trình. Không nên nhập mật khẩu, thông tin thẻ, giấy tờ tùy thân hoặc dữ liệu nhạy cảm không cần thiết. Kết quả AI chỉ mang tính tham khảo; bạn cần kiểm tra lại giá, lịch trình, điều kiện nhập cảnh và thông tin an toàn trước khi quyết định."] },
  { title: "Chia sẻ thông tin", paragraphs: ["TravelLens chỉ chia sẻ dữ liệu trong phạm vi cần thiết với nhà cung cấp tour, đơn vị thanh toán, hạ tầng lưu trữ, dịch vụ bản đồ, email/thông báo, công cụ phân tích hoặc cơ quan có thẩm quyền theo pháp luật. Các đối tác phải xử lý dữ liệu theo mục đích được giao và nghĩa vụ bảo mật tương ứng."] },
  { title: "Cookie và công nghệ tương tự", paragraphs: ["Chúng tôi có thể sử dụng cookie hoặc bộ nhớ cục bộ để duy trì đăng nhập, ghi nhớ tùy chọn, bảo vệ phiên làm việc và đo lường hiệu suất. Bạn có thể điều chỉnh cookie trong trình duyệt, nhưng một số chức năng có thể không hoạt động đầy đủ."] },
  { title: "Thời gian lưu trữ", paragraphs: ["Dữ liệu được lưu trong thời gian cần thiết để cung cấp dịch vụ, thực hiện nghĩa vụ kế toán/pháp lý, giải quyết tranh chấp và phòng chống gian lận. Khi không còn cần thiết, dữ liệu sẽ được xóa, ẩn danh hoặc hạn chế truy cập theo quy trình phù hợp."] },
  { title: "Bảo mật dữ liệu", paragraphs: ["TravelLens áp dụng các biện pháp kỹ thuật và tổ chức hợp lý như kiểm soát truy cập, phân quyền, mã hóa khi phù hợp, nhật ký hệ thống và sao lưu. Không phương thức truyền hoặc lưu trữ nào an toàn tuyệt đối; bạn có trách nhiệm bảo vệ mật khẩu và thông báo ngay khi nghi ngờ tài khoản bị truy cập trái phép."] },
  { title: "Quyền của bạn", items: ["Yêu cầu truy cập, cập nhật hoặc chỉnh sửa thông tin cá nhân.", "Yêu cầu xóa hoặc hạn chế xử lý trong phạm vi pháp luật cho phép.", "Rút lại sự đồng ý đối với xử lý dựa trên sự đồng ý.", "Phản đối một số hoạt động tiếp thị hoặc điều chỉnh tùy chọn thông báo.", "Khiếu nại về cách TravelLens xử lý dữ liệu của bạn."] },
  { title: "Dữ liệu trẻ em", paragraphs: ["TravelLens không chủ đích cung cấp tài khoản độc lập cho trẻ em chưa đủ tuổi theo pháp luật áp dụng. Thông tin trẻ em trong booking phải do cha mẹ, người giám hộ hoặc người đặt tour có thẩm quyền cung cấp."] },
  { title: "Thay đổi chính sách", paragraphs: ["Chúng tôi có thể cập nhật chính sách để phản ánh thay đổi của dịch vụ hoặc pháp luật. Phiên bản mới sẽ được công bố trên trang này cùng ngày cập nhật; thay đổi quan trọng có thể được thông báo thêm qua nền tảng hoặc email."] },
  { title: "Liên hệ", paragraphs: ["Nếu có yêu cầu về quyền riêng tư hoặc dữ liệu cá nhân, vui lòng sử dụng kênh hỗ trợ chính thức được công bố trên TravelLens. Để xác minh và bảo vệ tài khoản, chúng tôi có thể yêu cầu bạn cung cấp thông tin phù hợp trước khi xử lý yêu cầu."] }
];

export default function PrivacyPolicyPage() {
  return <LegalDocument eyebrow="Quyền riêng tư" title="Chính sách bảo mật" summary="TravelLens tôn trọng quyền riêng tư và cam kết xử lý dữ liệu cá nhân minh bạch, đúng mục đích và trong phạm vi cần thiết để cung cấp dịch vụ." updated="23/07/2026" sections={sections} />;
}
