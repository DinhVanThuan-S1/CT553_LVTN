# Yêu cầu bổ sung - EduPath System

> Tài liệu này bổ sung chi tiết cho `main-request.md`, mô tả cụ thể bố cục giao diện và luồng hoạt động của từng role.

---

## Trang chủ (Public)
- Header công khai: Logo, Menu điều hướng, Đăng nhập/Đăng ký
- Hero section: Giới thiệu hệ thống
- **Các Lộ trình nổi bật**: Hiển thị các lộ trình mẫu phổ biến nhất
- **Các Công việc nổi bật**: Hiển thị các tin tuyển dụng mới/hot nhất
- Mô tả nổi bật về tính năng hệ thống
- Footer

---

## 1. Sinh viên

### Header
- Tin nhắn
- Thông báo
- Avatar dropdown: Thông tin cá nhân, Cài đặt, Đăng xuất

### Sidebar Menu
1. **Tổng quan** - Dashboard tổng hợp
2. **Hồ sơ học tập** 
   - Chọn KHHT (Kế hoạch học tập) có sẵn (admin tạo sẵn)
   - Xem danh sách HP theo KHHT đã chọn
   - Nhập điểm cho từng HP (nếu có)
   - **Nếu không đúng**: Sinh viên có thể tự tạo KHHT custom
     - Chọn các Học kỳ
     - Thêm các HP có sẵn (admin tạo sẵn) vào từng HK
3. **Sở thích nghề nghiệp** - Hướng đi, khu vực, mức lương...
4. **Danh sách lộ trình**
   - Hiển thị các lộ trình mẫu (admin tạo sẵn)
   - **Nút "Gợi ý lộ trình"** (cho SV không biết chọn):
     - AI lấy dữ liệu: Hồ sơ học tập + Sở thích + Lộ trình mẫu + Kỹ năng hiện có
     - → Tạo lộ trình mới phù hợp cá nhân (có thể khác lộ trình mẫu, thêm/bớt kỹ năng)
     - SV có thể: **"Đăng ký lộ trình"** / **"Thoát"** / **"Phân tích lại"**
     - Đăng ký → Chuyển đến "Lộ trình của tôi"
5. **Lộ trình của tôi**
   - Trang chi tiết lộ trình đã đăng ký
   - **"Set lịch học"**:
     - Chọn thời gian học: 6 / 9 / 12 tháng
     - Nhập thời gian rảnh trong tuần
     - → AI sắp các buổi học nhỏ vào khung giờ rảnh
   - SV có thể tùy chỉnh lịch hoặc **"Bắt đầu học"**
   - → Chuyển đến "Tiến độ học"
6. **Tiến độ học**
   - Biểu đồ tiến độ
   - Xem lịch học theo: Tuần / Tháng / Cả lộ trình
   - Click vào buổi học → Xem chi tiết:
     - Học nội dung
     - Làm bài tập
     - Check hoàn thành (tùy ý)
   - Đủ số buổi → Làm bài Test (5-10 câu)
   - → Tính hoàn thành kỹ năng đó
7. **Skill Map** - Bản đồ kỹ năng trực quan
8. **Danh sách công việc**
   - Hiển thị các công việc (NTD đăng, admin duyệt)
   - **Nút "Gợi ý công việc"**: Sắp xếp theo độ phù hợp
   - SV có thể ứng tuyển
9. **CV**
   - SV tự điền thông tin CV
   - **Tự động lấy** kỹ năng + lộ trình đã hoàn thành từ hệ thống
   - SV KHÔNG tự chỉnh sửa phần auto → Tăng uy tín với NTD
10. **Đơn ứng tuyển** - Danh sách + trạng thái các đơn đã nộp
11. **Yêu thích** - Lộ trình và công việc đã lưu

---

## 2. Nhà tuyển dụng

### Header
- Tin nhắn
- Thông báo
- Avatar dropdown: Thông tin cá nhân, Cài đặt, Đăng xuất

### Sidebar Menu
1. **Tổng quan** - Dashboard NTD
2. **Hồ sơ công ty** - Thông tin, logo, địa chỉ
3. **Tin tuyển dụng** - CRUD tin tuyển dụng
4. **Ứng viên** - Quản lý ứng viên đã ứng tuyển

---

## 3. Quản trị viên

### Header
- Thông báo
- Avatar dropdown: Thông tin cá nhân, Cài đặt, Đăng xuất
- *(Không có Tin nhắn)*

### Sidebar Menu
1. **Tổng quan** - Dashboard thống kê
2. **QL Người dùng** - Sinh viên, Nhà tuyển dụng
3. **QL Học phần** - CRUD các học phần
4. **QL CTĐT** (Chương trình đào tạo)
   - Mỗi CTĐT mẫu = 1 KHHT (Kế hoạch học tập)
   - Chia thành nhiều Học kỳ
   - Mỗi HK gồm nhiều HP
5. **QL Kỹ năng**
   - Thêm/Sửa/Xóa kỹ năng
   - Mỗi kỹ năng có: Nội dung, Bài tập, Bài Test cuối
6. **QL Lộ trình mẫu** - Tạo/chỉnh sửa lộ trình mẫu (gồm nhiều kỹ năng có thứ tự)
7. **QL Tài nguyên** - Nội dung, bài tập, bài Test cho các kỹ năng
8. **QL Tin tuyển dụng** - Duyệt/từ chối tin NTD đăng
9. **Thống kê** - Báo cáo tổng hợp

---

## Luồng hoạt động chính (Student Flow)

```
Hồ sơ học tập → Sở thích → Danh sách lộ trình
                                    ↓
                            [Gợi ý lộ trình AI]
                                    ↓
                            Lộ trình của tôi
                                    ↓
                            [Set lịch học AI]
                                    ↓
                              Tiến độ học
                             ↙          ↘
                    Skill Map      Bài Test kỹ năng
                                    ↓
                            Danh sách công việc
                                    ↓
                            [Gợi ý công việc AI]
                                    ↓
                              Ứng tuyển (CV)
```
