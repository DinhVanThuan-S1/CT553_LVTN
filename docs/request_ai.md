# Mô tả chức năng hệ thống gợi ý lộ trình học tập, việc làm và chatbot AI
**Công nghệ dự kiến:** Python + Openrouter

---

## 1. Gợi ý lộ trình học tập và định hướng nghề nghiệp

Hệ thống hỗ trợ xây dựng lộ trình học tập và định hướng nghề nghiệp cá nhân hóa cho từng sinh viên dựa trên nhiều nguồn dữ liệu đầu vào. Mục tiêu là không chỉ gợi ý một hướng đi phù hợp, mà còn tạo ra một lộ trình học tập mới được điều chỉnh riêng theo năng lực, mục tiêu và bối cảnh của từng sinh viên.

### 1.1. Các nguồn dữ liệu đầu vào dùng để gợi ý

#### a. Hướng nghề nghiệp mong muốn
Ví dụ, sinh viên chọn các định hướng như Web, Mobile, Data, AI, DevOps,... thì hệ thống sẽ ưu tiên phân tích và gợi ý các lộ trình liên quan đến các hướng nghề đó.

- Ví dụ:
  - Sinh viên chọn **Web, Mobile**
  - Hệ thống gợi ý các lộ trình phù hợp với **Web, Mobile**

#### b. Khu vực làm việc mong muốn
Hệ thống xem xét khu vực mà sinh viên mong muốn làm việc, kết hợp với nhu cầu tuyển dụng hiện tại của khu vực đó để đề xuất hướng nghề phù hợp.

- Ví dụ:
  - Sinh viên muốn làm việc tại **Cần Thơ**, **Hồ Chí Minh**
  - Thị trường hiện tại tại các khu vực này đang tuyển nhiều **DevOps, Data, Web**
  - Hệ thống gợi ý các hướng nghề: **DevOps, Data, Web**

#### c. Mức lương mong muốn
Hệ thống phân tích mức lương mục tiêu mà sinh viên mong muốn và đối chiếu với dữ liệu thị trường để đề xuất các hướng nghề có khả năng đáp ứng mức thu nhập đó.

- Ví dụ:
  - Sinh viên muốn mức lương **trên 50 triệu/tháng**
  - Thị trường hiện tại cho thấy các nhóm nghề có thể đạt mức này gồm: **Data, AI, Nhúng**
  - Hệ thống gợi ý: **Data, AI, Nhúng**

#### d. Công ty sinh viên quan tâm
Hệ thống phân tích các công ty mà sinh viên muốn ứng tuyển, sau đó đối chiếu với các vị trí tuyển dụng phổ biến của những công ty đó để gợi ý hướng phát triển phù hợp.

- Ví dụ:
  - Sinh viên quan tâm đến **FPT Software**
  - FPT Software hiện đang tuyển nhiều vị trí **Java Backend**, **Frontend React**
  - Hệ thống gợi ý: **Java Backend**, **Frontend React**

#### e. Hồ sơ học tập
Hệ thống khai thác hồ sơ học tập của sinh viên, bao gồm ngành học, các học phần đã học, kết quả học tập và mức độ liên quan giữa các môn học với từng nhóm nghề nghiệp.

- Ví dụ:
  - Sinh viên đang học ngành **Kỹ thuật phần mềm**
  - Đã học các học phần liên quan đến **Web, Kiểm thử, Quản lý dự án**
  - Hệ thống có thể gợi ý các hướng phù hợp như:
    - **Web Developer**
    - **QA/Test**
    - **Quản lý dự án**
    - **Phân tích viên**

#### f. Kết quả học tập trong từng học phần
Ngoài việc xem xét tổng quan hồ sơ học tập, hệ thống còn phân tích điểm số cụ thể của từng học phần để xác định thế mạnh nổi bật của sinh viên.

- Ví dụ:
  - Sinh viên có điểm cao môn **CT449 - Phát triển ứng dụng Web**
  - Hệ thống tăng độ ưu tiên cho hướng **Web Development**

#### g. Skill Map / kỹ năng hiện có
Hệ thống phân tích các kỹ năng sinh viên đã có để gợi ý các vai trò nghề nghiệp phù hợp hơn, đặc biệt là các hướng đi mang tính tổ hợp kỹ năng.

- Ví dụ:
  - Sinh viên có kỹ năng **React**, **Express**
  - Hệ thống gợi ý hướng **Full-stack Express/React**

---

### 1.2. Cơ chế tổng hợp và tạo lộ trình cá nhân hóa

Sau khi thu thập và tổng hợp toàn bộ dữ liệu đầu vào, hệ thống sử dụng **Openrouter** hoặc một **thuật toán gợi ý** để sinh ra một lộ trình học tập hoàn toàn mới cho từng cá nhân.

Lộ trình được tạo ra dựa trên:
- Lộ trình mẫu có sẵn trong hệ thống
- Hồ sơ học tập của sinh viên
- Kỹ năng hiện có
- Điểm mạnh, điểm yếu
- Mục tiêu nghề nghiệp
- Mục tiêu khu vực làm việc, mức lương, công ty quan tâm

Điểm quan trọng là lộ trình mới **không nhất thiết phải giống hoàn toàn lộ trình mẫu**, mà sẽ được điều chỉnh linh hoạt bằng cách:
- **Giảm bớt** các nội dung sinh viên đã thành thạo
- **Tăng cường** các nội dung sinh viên còn yếu
- **Bổ sung** thêm các kỹ năng còn thiếu để phù hợp với mục tiêu nghề nghiệp

#### Ví dụ minh họa
Nếu hệ thống xây dựng lộ trình mới dựa trên lộ trình mẫu **Full-stack Web**, thì có thể điều chỉnh như sau:

- Sinh viên có điểm cao môn **CT449** (đã nắm tốt **HTML, CSS, JavaScript**)  
  → Giảm bớt các buổi học **HTML/CSS/JS cơ bản**

- Sinh viên có kết quả chưa tốt ở các môn **CT178, CT179** liên quan đến **DevOps**  
  → Thêm các buổi học về **Docker**, **CI/CD**, **triển khai hệ thống**

- Sinh viên đã có kỹ năng **React**  
  → Giảm bớt các buổi học **React cơ bản**, tăng tỷ lệ nội dung thực hành nâng cao

Như vậy, đầu ra của hệ thống không chỉ là một danh sách nghề nghiệp gợi ý, mà còn là một **lộ trình học tập cá nhân hóa**, sát với năng lực thực tế và mục tiêu của từng sinh viên.

---

## 2. Gợi ý công việc

Hệ thống hỗ trợ gợi ý các công việc phù hợp cho sinh viên dựa trên hồ sơ cá nhân, định hướng nghề nghiệp và nhu cầu tuyển dụng.

### 2.1. Các tiêu chí lọc công việc
Công việc được gợi ý có thể được lọc theo nhiều tiêu chí như:

- **Hướng nghề nghiệp**
- **Kỹ năng hiện có của sinh viên**
- **Loại hình công việc**
- **Mức lương**
- **Địa điểm làm việc**
- **Hình thức cộng tác**

### 2.2. Mục tiêu của chức năng gợi ý việc làm
Chức năng này giúp sinh viên:
- Dễ dàng tìm thấy các công việc phù hợp với năng lực hiện tại
- Nhìn rõ khoảng cách giữa năng lực hiện có và yêu cầu tuyển dụng
- Định hướng học tập bổ sung để tăng khả năng ứng tuyển
- Tiếp cận cả các công việc chính thức lẫn cơ hội cộng tác phù hợp

---

## 3. Chatbot AI: Chat theo cơ sở dữ liệu và chat tự do

Hệ thống tích hợp chatbot AI nhằm hỗ trợ sinh viên tương tác thuận tiện hơn, đặc biệt với những sinh viên chưa hiểu rõ về hệ thống hoặc chưa có kiến thức nền về định hướng nghề nghiệp.

### 3.1. Chat theo cơ sở dữ liệu
Chatbot có khả năng trả lời dựa trên dữ liệu có sẵn trong hệ thống, ví dụ:
- Thông tin về các hướng nghề nghiệp
- Thông tin lộ trình học tập
- Gợi ý kỹ năng cần học
- Hướng dẫn sử dụng hệ thống
- Hướng dẫn nhập hoặc tải lên hồ sơ học tập
- Thông tin về việc làm, mức lương, khu vực tuyển dụng

### 3.2. Chat tự do
Ngoài chế độ hỏi đáp theo dữ liệu hệ thống, chatbot còn hỗ trợ trò chuyện tự do để:
- Giải thích các khái niệm nghề nghiệp cơ bản
- Tư vấn cho sinh viên chưa biết nên bắt đầu từ đâu
- Hỗ trợ sinh viên khám phá sở thích nghề nghiệp
- Gợi ý các bước đầu tiên để xây dựng hồ sơ định hướng nghề nghiệp

### 3.3. Vai trò của chatbot trong hệ thống
Chatbot AI đóng vai trò như một trợ lý hỗ trợ sinh viên:
- Dành cho sinh viên chưa biết gì về hệ thống
- Dành cho sinh viên chưa có kiến thức rõ ràng về các hướng đi nghề nghiệp
- Hướng dẫn cách tải lên hồ sơ học tập
- Hỗ trợ khai báo sở thích nghề nghiệp
- Giải thích kết quả gợi ý lộ trình và việc làm

---

## 4. Tóm tắt giá trị của hệ thống

Hệ thống hướng đến việc hỗ trợ sinh viên trong quá trình:
- Tự đánh giá năng lực bản thân
- Xác định hướng nghề nghiệp phù hợp
- Xây dựng lộ trình học tập cá nhân hóa
- Tiếp cận cơ hội việc làm phù hợp
- Được hỗ trợ bởi chatbot AI trong suốt quá trình sử dụng

Với việc kết hợp giữa **Python**, **Openrouter**, dữ liệu học tập, dữ liệu kỹ năng và dữ liệu tuyển dụng, hệ thống có thể trở thành một nền tảng hỗ trợ định hướng nghề nghiệp và cá nhân hóa lộ trình học tập một cách linh hoạt, thực tiễn và phù hợp với từng sinh viên.
