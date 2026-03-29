# PROMPT MÔ TẢ HỆ THỐNG

Bạn đang tham gia phát triển hệ thống:

**“PHÁT TRIỂN HỆ THỐNG CÁ NHÂN HOÁ LỘ TRÌNH HỌC TẬP & ĐỊNH HƯỚNG NGHỀ NGHIỆP CHO SINH VIÊN CNTT, CÓ TÍCH HỢP HỆ THỐNG GỢI Ý”**

Hãy luôn xem toàn bộ thông tin dưới đây là bối cảnh cố định của hệ thống.

---

## 1. BỐI CẢNH HỆ THỐNG

Đây là một hệ thống web phục vụ 4 nhóm người dùng chính:
- Khách vãng lai
- Sinh viên
- Nhà tuyển dụng
- Quản trị viên

Mục tiêu của hệ thống:
- Hỗ trợ sinh viên CNTT nhập hồ sơ học tập, phân tích năng lực, xem Skill Map và được gợi ý lộ trình học tập phù hợp.
- Hỗ trợ sinh viên chọn và cá nhân hóa lộ trình học theo thời gian học, thời khóa biểu trường và giờ rảnh.
- Hỗ trợ sinh viên theo dõi lịch học, học theo từng buổi, làm bài test kỹ năng và xem tiến độ học tập.
- Hỗ trợ sinh viên tìm kiếm việc làm, xem mức độ phù hợp, quản lý CV, ứng tuyển và theo dõi trạng thái đơn ứng tuyển.
- Hỗ trợ nhà tuyển dụng cập nhật hồ sơ công ty, đăng tin tuyển dụng, xem CV ứng viên, đánh giá mức độ phù hợp và hẹn phỏng vấn.
- Hỗ trợ quản trị viên quản lý sinh viên, nhà tuyển dụng, chương trình đào tạo, học phần, kỹ năng, lộ trình, công việc và xem báo cáo thống kê toàn hệ thống.

Bản chất hệ thống gồm 2 trục lớn:
- Trục học tập và cá nhân hóa lộ trình học tập cho sinh viên.
- Trục nghề nghiệp và kết nối sinh viên với nhà tuyển dụng.

Các dữ liệu quan trọng của hệ thống:
- Tài khoản người dùng và phân quyền.
- Hồ sơ học tập của sinh viên.
- Chương trình đào tạo, học phần, kiến thức và kỹ năng liên quan.
- Skill Map và mức độ năng lực.
- Lộ trình học mẫu và lộ trình cá nhân hóa.
- Lịch học, buổi học, tài nguyên, bài tập, bài test.
- Hồ sơ sở thích nghề nghiệp.
- Tin tuyển dụng, CV, đơn ứng tuyển.
- Hồ sơ công ty, địa chỉ tuyển dụng.
- Dữ liệu báo cáo và thống kê.

---

## 2. MÔ TẢ CHI TIẾT CÁC CHỨC NĂNG
### (Thành phần và luồng chính)

### A. CHỨC NĂNG CHUNG / KHÁCH VÃNG LAI / XÁC THỰC

#### 1. Đăng ký tài khoản
**Thành phần:**
- Trang đăng ký
- Chọn vai trò Sinh viên hoặc Nhà tuyển dụng
- Form nhập họ tên, email, mật khẩu, xác nhận mật khẩu, SĐT
- Tích hợp đăng ký bằng Google OAuth
- Kiểm tra dữ liệu đầu vào và lưu tài khoản

**Luồng chính:**
- Khách chọn đăng ký
- Hệ thống hiển thị trang đăng ký
- Khách chọn vai trò
- Hệ thống hiển thị form phù hợp
- Khách nhập thông tin và gửi đăng ký
- Hệ thống kiểm tra dữ liệu
- Hệ thống lưu tài khoản và thông báo thành công
- Hệ thống chuyển sang trang đăng nhập

#### 2. Đăng nhập
**Thành phần:**
- Form đăng nhập
- Nhập email và mật khẩu
- Đăng nhập bằng Google OAuth cho Sinh viên và Nhà tuyển dụng
- Xác thực tài khoản và điều hướng theo vai trò

**Luồng chính:**
- Người dùng chọn đăng nhập
- Hệ thống hiển thị form
- Người dùng nhập thông tin
- Hệ thống xác thực
- Đăng nhập thành công và chuyển đến trang chủ theo vai trò

#### 3. Đăng xuất
**Thành phần:**
- Nút đăng xuất
- Xác nhận đăng xuất
- Kết thúc phiên làm việc

**Luồng chính:**
- Người dùng chọn đăng xuất
- Hệ thống xác nhận
- Hệ thống kết thúc phiên
- Chuyển về trang đăng nhập

#### 4. Cập nhật thông tin cá nhân
**Thành phần:**
- Trang cài đặt / hồ sơ cá nhân
- Form họ tên, SĐT, ảnh đại diện, địa chỉ
- Kiểm tra dữ liệu và lưu thay đổi

**Luồng chính:**
- Người dùng mở trang thông tin cá nhân
- Hệ thống hiển thị dữ liệu hiện tại
- Người dùng chỉnh sửa
- Người dùng lưu thay đổi
- Hệ thống kiểm tra và cập nhật thành công

#### 5. Đổi mật khẩu
**Thành phần:**
- Form mật khẩu hiện tại, mật khẩu mới, xác nhận mật khẩu mới
- Áp dụng cho tài khoản hệ thống, không áp dụng cho Google

**Luồng chính:**
- Người dùng mở trang đổi mật khẩu
- Hệ thống hiển thị form
- Người dùng nhập thông tin
- Hệ thống kiểm tra
- Hệ thống cập nhật mật khẩu mới

### B. CHỨC NĂNG CHO SINH VIÊN - HỌC TẬP, NĂNG LỰC, LỘ TRÌNH

#### 6. Nhập hồ sơ học tập
**Thành phần:**
- Trang hồ sơ học tập
- Chọn chương trình đào tạo
- Danh sách học phần theo học kỳ
- Nhập điểm theo từng học phần
- Tùy chỉnh học phần theo từng học kỳ
- Tính GPA

**Luồng chính:**
- Sinh viên mở hồ sơ học tập
- Chọn CTĐT
- Hệ thống hiển thị học phần theo học kỳ
- Sinh viên chọn học kỳ, năm học
- Sinh viên nhập điểm
- Hệ thống kiểm tra dữ liệu
- Hệ thống lưu và tính GPA

#### 7. Xem Skill Map
**Thành phần:**
- Biểu đồ radar
- Các nhóm kỹ năng: Lập trình, Framework, CSDL, Công cụ, Kỹ năng mềm...
- Chi tiết kỹ năng theo từng nhóm

**Luồng chính:**
- Sinh viên mở mục Skill Map
- Hệ thống tính toán từ hồ sơ học tập
- Hệ thống hiển thị biểu đồ năng lực
- Sinh viên xem tổng quan và chi tiết từng nhóm

#### 8. Cập nhật sở thích nghề nghiệp
**Thành phần:**
- Form hướng nghề nghiệp
- Khu vực làm việc mong muốn
- Danh sách công ty quan tâm
- Mức lương mong muốn

**Luồng chính:**
- Sinh viên mở phần hướng nghề nghiệp
- Hệ thống hiển thị form hiện tại
- Sinh viên cập nhật thông tin
- Sinh viên lưu và phân tích
- Hệ thống lưu dữ liệu

#### 9. Xem gợi ý lộ trình
**Thành phần:**
- Trang danh sách lộ trình gợi ý
- Phần trăm phù hợp
- Phân tích hồ sơ học tập và sở thích nghề nghiệp

**Luồng chính:**
- Sinh viên mở mục Lộ trình
- Hệ thống phân tích hồ sơ học tập và sở thích nghề nghiệp
- Hệ thống hiển thị các lộ trình gợi ý kèm % phù hợp
- Sinh viên xem hoặc chọn lộ trình

#### 10. Chọn và tùy chỉnh lộ trình học
**Thành phần:**
- Bước chọn thời gian học: 6, 9 hoặc 12 tháng
- Bước nhập thời khóa biểu trường
- Bước chọn giờ rảnh
- Bộ máy tạo lịch học cá nhân hóa
- Lưu lộ trình cá nhân

**Luồng chính:**
- Sinh viên chọn một lộ trình
- Hệ thống hiển thị bước chọn thời gian học
- Sinh viên chọn thời gian
- Hệ thống hiển thị bước nhập TKB trường
- Sinh viên nhập lịch học trên trường
- Hệ thống hiển thị bước chọn giờ rảnh
- Sinh viên chọn khung giờ rảnh
- Sinh viên tạo lịch học
- Hệ thống phân bổ kỹ năng theo tuần vào các khung giờ rảnh
- Hệ thống hiển thị lịch học dự kiến
- Sinh viên xác nhận
- Hệ thống lưu lộ trình cá nhân và chuyển sang trang tiến độ

#### 11. Xem lịch học
**Thành phần:**
- Lịch học theo tuần
- Thông tin ngày, giờ, kỹ năng, tài nguyên, trạng thái
- Điều hướng tuần trước / tuần sau

**Luồng chính:**
- Sinh viên mở mục Lịch học hoặc Tiến độ
- Hệ thống hiển thị tuần hiện tại
- Sinh viên xem hoặc chuyển tuần
- Sinh viên có thể mở chi tiết một buổi học

#### 12. Học tập theo buổi
**Thành phần:**
- Trang chi tiết buổi học
- Tên kỹ năng
- Tài nguyên học tập
- Bài tập thực hành
- Trạng thái hoàn thành

**Luồng chính:**
- Sinh viên mở một buổi học
- Hệ thống hiển thị tài nguyên và bài tập
- Sinh viên học và thực hành
- Sinh viên đánh dấu hoàn thành
- Hệ thống cập nhật tiến độ

#### 13. Làm bài Test kỹ năng
**Thành phần:**
- Bài test trắc nghiệm
- Danh sách câu hỏi và đáp án
- Thanh tiến độ
- Trang kết quả

**Luồng chính:**
- Sinh viên mở bài test của kỹ năng đã hoàn thành
- Hệ thống hiển thị câu hỏi
- Sinh viên lần lượt trả lời
- Sinh viên nộp bài
- Hệ thống chấm điểm và hiển thị kết quả

#### 14. Xem tiến độ học tập
**Thành phần:**
- Thẻ tổng quan % hoàn thành
- Readiness Score
- Tổng giờ học
- Ngày kết thúc dự kiến
- Danh sách kỹ năng với tiến độ và trạng thái test
- Lịch tuần hiện tại

**Luồng chính:**
- Sinh viên mở mục Tiến độ
- Hệ thống tổng hợp tiến độ lộ trình
- Hệ thống hiển thị dữ liệu tổng quan và chi tiết kỹ năng
- Sinh viên xem tiến độ học tập hiện tại

#### 15. Đánh giá lộ trình
**Thành phần:**
- Form đánh giá sao
- Ô nhận xét
- Điểm đánh giá trung bình của lộ trình

**Luồng chính:**
- Sinh viên mở chi tiết lộ trình
- Chọn viết đánh giá
- Nhập số sao và nhận xét
- Hệ thống lưu đánh giá và cập nhật điểm trung bình

### C. CHỨC NĂNG CHO SINH VIÊN - CÔNG VIỆC, CV, ỨNG TUYỂN

#### 16. Tìm kiếm công việc
**Thành phần:**
- Trang danh sách công việc
- Ô tìm kiếm
- Bộ lọc: hướng nghề nghiệp, khu vực, loại hình, mức lương, kỹ năng
- Sắp xếp: mới nhất, lương cao nhất, sắp hết hạn
- Match % cho sinh viên đã có hồ sơ
- Nút Gợi ý ML

**Luồng chính:**
- Người dùng mở mục Công việc
- Hệ thống hiển thị danh sách việc làm đã duyệt
- Người dùng nhập từ khóa hoặc chọn bộ lọc
- Hệ thống trả kết quả phù hợp
- Sinh viên đã đăng nhập có thể xem match %
- Sinh viên có thể dùng Gợi ý ML để ưu tiên các việc làm phù hợp hơn

#### 17. Thêm công việc / lộ trình vào yêu thích
**Thành phần:**
- Biểu tượng yêu thích
- Danh sách yêu thích

**Luồng chính:**
- Sinh viên nhấn biểu tượng yêu thích
- Hệ thống ghi nhận
- Cho phép bỏ yêu thích khi nhấn lại

#### 18. Ứng tuyển
**Thành phần:**
- Popup ứng tuyển
- Danh sách CV của sinh viên
- Hiển thị match % và kỹ năng còn thiếu
- Gửi đơn ứng tuyển

**Luồng chính:**
- Sinh viên chọn ứng tuyển tại một tin
- Hệ thống hiển thị popup và danh sách CV
- Sinh viên chọn CV
- Sinh viên nộp đơn
- Hệ thống lưu đơn và gửi thông báo cho nhà tuyển dụng

#### 19. Xem danh sách đơn ứng tuyển
**Thành phần:**
- Trang danh sách đơn ứng tuyển
- Bộ lọc theo trạng thái
- Trang chi tiết đơn
- Chức năng rút đơn

**Luồng chính:**
- Sinh viên mở mục Đơn ứng tuyển
- Hệ thống hiển thị danh sách đơn
- Sinh viên xem trạng thái
- Có thể lọc, xem chi tiết hoặc rút đơn

#### 20. Quản lý CV
**Thành phần:**
- Danh sách CV
- Tạo CV mới
- Sửa CV
- Xóa CV
- Đặt CV mặc định
- Upload file CV PDF/DOCX

**Luồng chính:**
- Sinh viên mở mục CV
- Hệ thống hiển thị danh sách CV
- Sinh viên tạo mới hoặc chỉnh sửa
- Hệ thống lưu và cập nhật CV
- Sinh viên có thể chọn CV mặc định

#### 21. Trò chuyện
**Thành phần:**
- Danh sách cuộc trò chuyện
- Khung chat
- Tin nhắn thời gian thực
- Tạo chat mới

**Luồng chính:**
- Người dùng mở mục Chat
- Hệ thống hiển thị danh sách hội thoại
- Người dùng chọn cuộc trò chuyện
- Nhập và gửi tin nhắn
- Hệ thống hiển thị tin nhắn theo thời gian thực

### D. CHỨC NĂNG DÙNG CHUNG CHO KHÁCH VÃNG LAI / SINH VIÊN

#### 22. Xem danh sách và chi tiết lộ trình
**Thành phần:**
- Trang danh sách lộ trình
- Trang chi tiết lộ trình
- Hiển thị kỹ năng, thời gian, tài nguyên, công việc liên quan, đánh giá

**Luồng chính:**
- Người dùng mở mục Lộ trình
- Hệ thống hiển thị danh sách
- Người dùng chọn một lộ trình
- Hệ thống hiển thị chi tiết lộ trình

#### 23. Tìm kiếm lộ trình
**Thành phần:**
- Ô tìm kiếm
- Bộ lọc theo hướng nghề nghiệp
- Sắp xếp
- Match % cho sinh viên đã đăng nhập

**Luồng chính:**
- Người dùng mở trang lộ trình
- Nhập từ khóa hoặc chọn bộ lọc
- Hệ thống hiển thị danh sách phù hợp
- Sinh viên có thể xem thêm match %

#### 24. Xem danh sách và chi tiết công việc
**Thành phần:**
- Trang danh sách công việc
- Trang chi tiết công việc
- Bộ lọc và tìm kiếm

**Luồng chính:**
- Người dùng mở mục Công việc
- Hệ thống hiển thị danh sách việc làm đã duyệt
- Người dùng chọn một việc làm
- Hệ thống hiển thị chi tiết việc làm

### E. CHỨC NĂNG CHO NHÀ TUYỂN DỤNG

#### 25. Cập nhật hồ sơ công ty
**Thành phần:**
- Trang hồ sơ công ty
- Form tên công ty, mô tả, ngành nghề, website, logo, quy mô
- Danh sách địa chỉ văn phòng

**Luồng chính:**
- NTD mở mục Công ty
- Hệ thống hiển thị hồ sơ công ty
- NTD nhập hoặc chỉnh sửa thông tin
- Hệ thống lưu hồ sơ công ty

#### 26. Quản lý địa chỉ tuyển dụng
**Thành phần:**
- Danh sách địa chỉ
- Thêm / sửa / xóa địa chỉ
- Chọn trụ sở chính

**Luồng chính:**
- NTD mở phần địa chỉ tuyển dụng
- Xem danh sách địa chỉ
- Thêm, sửa hoặc xóa địa chỉ
- Hệ thống đảm bảo chỉ có 1 trụ sở chính

#### 27. Quản lý tin tuyển dụng
**Thành phần:**
- Bảng danh sách tin
- Form tạo tin
- Chỉnh sửa tin
- Xóa tin
- Lưu nháp
- Gửi duyệt

**Luồng chính:**
- NTD mở mục Tin tuyển dụng
- Xem danh sách tin
- Tạo hoặc chỉnh sửa tin
- Hệ thống kiểm tra dữ liệu
- Tin được lưu ở trạng thái Nháp hoặc Chờ duyệt

#### 28. Xem danh sách và chi tiết CV ứng viên
**Thành phần:**
- Danh sách CV ứng viên
- Match %
- Chi tiết ứng viên
- Skill Map
- Điểm kỹ năng, bài test, kinh nghiệm, dự án, file CV

**Luồng chính:**
- NTD mở danh sách CV ứng viên
- Hệ thống hiển thị các CV theo vị trí tuyển dụng
- NTD chọn một ứng viên
- Hệ thống hiển thị hồ sơ chi tiết và mức độ phù hợp

#### 29. Duyệt CV ứng viên và hẹn phỏng vấn
**Thành phần:**
- Popup hẹn phỏng vấn
- Ngày giờ
- Hình thức online / trực tiếp
- Link phỏng vấn
- Ghi chú

**Luồng chính:**
- NTD chọn duyệt và hẹn phỏng vấn
- Nhập thông tin phỏng vấn
- Xác nhận gửi
- Hệ thống cập nhật trạng thái đơn và gửi thông báo cho sinh viên

#### 30. Từ chối CV ứng viên
**Thành phần:**
- Popup xác nhận từ chối
- Ô nhập lý do tùy chọn

**Luồng chính:**
- NTD chọn từ chối ứng viên
- Xác nhận thao tác
- Hệ thống cập nhật trạng thái và gửi thông báo

#### 31. Trò chuyện
**Thành phần:**
- Danh sách chat
- Gửi và nhận tin nhắn theo thời gian thực

**Luồng chính:**
- NTD vào mục Chat
- Chọn hội thoại
- Trao đổi trực tiếp với sinh viên

### F. CHỨC NĂNG CHO QUẢN TRỊ VIÊN

#### 32. Quản lý sinh viên
**Thành phần:**
- Danh sách sinh viên
- Tìm kiếm
- Khóa / mở khóa tài khoản
- Xem chi tiết hồ sơ sinh viên

**Luồng chính:**
- Admin mở mục quản lý sinh viên
- Hệ thống hiển thị danh sách
- Admin tìm kiếm, khóa/mở khóa hoặc xem chi tiết

#### 33. Quản lý nhà tuyển dụng
**Thành phần:**
- Danh sách nhà tuyển dụng
- Tìm kiếm
- Khóa / mở khóa

**Luồng chính:**
- Admin mở mục quản lý nhà tuyển dụng
- Hệ thống hiển thị danh sách
- Admin thực hiện các thao tác quản lý trạng thái

#### 34. Quản lý tin tuyển dụng
**Thành phần:**
- Danh sách toàn bộ tin tuyển dụng
- Danh sách tin chờ duyệt
- Duyệt tin
- Từ chối tin
- Xóa tin vi phạm
- Xem chi tiết tin

**Luồng chính:**
- Admin mở mục quản lý tin tuyển dụng
- Hệ thống hiển thị danh sách
- Admin lọc trạng thái hoặc xem tin chờ duyệt
- Admin duyệt hoặc từ chối tin
- Hệ thống cập nhật trạng thái và gửi thông báo cho NTD

#### 35. Quản lý chương trình đào tạo
**Thành phần:**
- Danh sách CTĐT
- Form mã CTĐT, tên, khoa, trường, mô tả, tổng tín chỉ
- Chọn học kỳ niên khóa
- Gán học phần vào từng học kỳ

**Luồng chính:**
- Admin mở mục quản lý CTĐT
- Xem danh sách
- Thêm, sửa, xóa CTĐT
- Gán học phần vào cấu trúc niên khóa

#### 36. Quản lý học phần
**Thành phần:**
- Danh sách học phần
- Form mã HP, tên HP, số tín chỉ, loại học phần
- Tiên quyết, song hành
- Mô tả, kiến thức lý thuyết, kiến thức thực hành, kỹ năng liên quan

**Luồng chính:**
- Admin mở mục quản lý học phần
- Xem danh sách
- Thêm, sửa hoặc xóa học phần

#### 37. Quản lý kỹ năng
**Thành phần:**
- Danh sách kỹ năng
- Form kỹ năng cơ bản
- Tài nguyên học tập
- Bài tập thực hành
- Bộ câu hỏi test

**Luồng chính:**
- Admin mở mục quản lý kỹ năng
- Thêm hoặc chỉnh sửa kỹ năng
- Gắn tài nguyên, bài tập và câu hỏi test
- Hệ thống lưu toàn bộ dữ liệu kỹ năng

#### 38. Quản lý lộ trình học
**Thành phần:**
- Danh sách lộ trình mẫu
- Form tạo lộ trình
- Chọn hướng đi, mô tả, thời lượng
- Kéo thả sắp xếp kỹ năng
- Liên kết công việc liên quan
- Xem đánh giá lộ trình

**Luồng chính:**
- Admin mở mục quản lý lộ trình
- Tạo mới hoặc chỉnh sửa lộ trình mẫu
- Chọn kỹ năng và sắp xếp thứ tự học
- Hệ thống lưu lộ trình

#### 39. Quản lý công việc
**Thành phần:**
- Danh sách job template
- Form tiêu đề, mô tả, hướng đi, kỹ năng yêu cầu, mức lương tham khảo

**Luồng chính:**
- Admin mở mục quản lý công việc
- Xem danh sách
- Thêm, sửa, xóa các mẫu công việc phục vụ gợi ý và so khớp

#### 40. Xem báo cáo và thống kê
**Thành phần:**
- Dashboard báo cáo
- Biểu đồ số SV đăng ký theo tháng
- Hướng nghề nghiệp phổ biến
- Tỷ lệ hoàn thành lộ trình
- Top kỹ năng học nhiều nhất
- Thống kê ứng tuyển
- Thống kê tin tuyển dụng
- Lọc theo thời gian
- Xuất báo cáo PDF / Excel

**Luồng chính:**
- Admin mở mục Báo cáo
- Hệ thống hiển thị các biểu đồ và bảng thống kê
- Admin lọc theo thời gian hoặc xuất báo cáo

---

## 3. CÔNG NGHỆ CỐT LÕI CỦA HỆ THỐNG

### Công nghệ cốt lõi
- MongoDB
- ExpressJS
- ReactJS
- NodeJS
- Javascript
- Python
- Tailwind CSS
- shadcn/ui
- Các mô hình LLM của Ollama

### Định hướng triển khai
- Hệ thống được tổ chức rõ ràng theo các phần: backend, frontend, ai-service...
- Frontend xây dựng web hiện đại, nhất quán giữa Sinh viên, Nhà tuyển dụng và Quản trị viên.
- Backend xử lý nghiệp vụ, phân quyền, quản lý dữ liệu người dùng, học tập, lộ trình, công việc và ứng tuyển.
- AI service xử lý các bài toán gợi ý và phân tích dữ liệu học tập / nghề nghiệp.

### Công nghệ của chức năng “Gợi ý lộ trình”
- Sử dụng mô hình LLM của Ollama
- Dữ liệu đầu vào gồm:
  - Hồ sơ học tập
  - Sở thích nghề nghiệp
  - Lộ trình mẫu do Admin quản lý
- Mục tiêu:
  - Phân tích năng lực hiện tại
  - Đối chiếu với sở thích nghề nghiệp
  - Gợi ý các lộ trình phù hợp
  - Trả về danh sách lộ trình kèm phần trăm phù hợp

### Công nghệ của chức năng “Gợi ý việc làm”
- Dự kiến sử dụng:
  - Lọc nội dung (Content-based filtering)
  - Lọc cộng tác (Collaborative filtering)
- Dữ liệu có thể dùng để so khớp:
  - Kỹ năng sinh viên
  - Hồ sơ học tập
  - Sở thích nghề nghiệp
  - CV
  - Hướng nghề nghiệp
  - Các công việc đã lưu / đã ứng tuyển
  - Kỹ năng yêu cầu của tin tuyển dụng
- Mục tiêu:
  - Sắp xếp việc làm theo mức độ phù hợp
  - Hiển thị match %
  - Hỗ trợ sinh viên tìm việc phù hợp hơn

---

## 4. CÁC NGUYÊN TẮC QUAN TRỌNG

1. Sử dụng công nghệ hiện đại và phiên bản mới nhất của từng công nghệ, theo bối cảnh hiện tại là năm 2026.

2. Giao diện phải đẹp, hiện đại và nhất quán giữa các vai trò:
- Quản trị viên
- Sinh viên
- Nhà tuyển dụng

3. Cấu trúc mã nguồn phải rõ ràng, tách lớp và phân cấp hợp lý:
- backend
- frontend
- ai-service
- tài liệu dự án

4. Luôn comment hoặc ghi chú công dụng của file, hàm, biến và các thành phần quan trọng.

5. Luôn phản hồi bằng tiếng Việt.

6. Phải tạo tài liệu theo từng phần và từng bước thực hiện để theo dõi tiến độ dự án, ví dụ:
- BE
- FE
- AI
- Docs nghiệp vụ
- Docs API
- Docs dữ liệu
- Docs tiến độ

7. Luôn bám sát yêu cầu nghiệp vụ đã mô tả; không làm sai hoặc thiếu luồng chức năng.

8. Phải đảm bảo dữ liệu mẫu giúp AI hiểu rõ cấu trúc dữ liệu của hệ thống, bao gồm:
- Học phần: STT, Mã HP, Tên HP, Số tín chỉ, Loại học phần, Tiên quyết, Song hành, Mô tả chi tiết, Kiến thức lý thuyết, Kiến thức thực hành
- Cấu trúc điểm: A, B+, B, C+, C, D+, D, F
- Cấu trúc Học kỳ - Niên khóa:
  - Mỗi niên khóa là 2 năm liên tiếp
  - Mỗi niên khóa có 3 học kỳ
  - Ví dụ: Niên khóa 2023-2024 gồm HK1, HK2, HK3

9. Khi mô tả, phân tích, thiết kế hoặc triển khai, phải luôn giữ đúng ngữ cảnh của một hệ thống:
- cá nhân hóa lộ trình học tập
- định hướng nghề nghiệp
- kết nối sinh viên CNTT với việc làm
- tích hợp hệ thống gợi ý

10. Mọi thành phần giao diện, luồng xử lý và dữ liệu đều phải phục vụ rõ ràng cho mục tiêu học tập, đánh giá năng lực, gợi ý lộ trình và gợi ý việc làm.

Hãy luôn lấy toàn bộ nội dung trên làm ngữ cảnh chuẩn của dự án.
