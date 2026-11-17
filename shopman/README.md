# ShopMan — tầng giao diện JSP

Giao diện dùng nền trắng, menu ngang và bảng biểu đơn giản, không có icon trang trí hoặc slogan.

9 màn hình, mỗi màn hình một file JSP; không cần Entity, DAO hoặc CSDL để trải nghiệm. Được dựng theo hai module trong báo cáo sơ bộ và nội dung cuộc trò chuyện được chia sẻ. CSS, hình SVG và dữ liệu giả dùng chung; logic riêng của từng trang nằm ngay trong file JSP đó. Không sử dụng React hoặc bộ định tuyến gom mọi màn hình vào một file.

## Chạy ngay trên Windows

Từ thư mục BTL, mở PowerShell và chạy:

```powershell
powershell -ExecutionPolicy Bypass -File .\shopman\start.ps1
```

Mở **http://127.0.0.1:4173**. Giữ cửa sổ PowerShell đang chạy; nhấn Ctrl+C khi muốn dừng. Script dùng Node.js có sẵn trong PATH hoặc runtime Node đi kèm Codex. Nếu máy khác không có cả hai, cần Node.js 18 trở lên. Không cần `npm install`.

Cách khác, khi máy đã có Node.js:

```powershell
cd shopman
npm start
```

Máy chủ `preview.mjs` phục vụ giao diện và xử lý đăng nhập, phiên chọn bản ghi bằng Node.js; **không thực thi Java/JSP**. Khi xem thử, máy chủ thay các biểu thức context của JSP bằng JSON từ phiên. Không mở file `.jsp` trực tiếp bằng cách nhấp đúp.

## Tài khoản giả lập

| Vai trò | Tên đăng nhập | Mật khẩu |
| --- | --- | --- |
| Khách hàng | `khachhang` | `demo123` |
| Admin | `Admin` | `demo123` |

Chọn vai trò trên trang đăng nhập. Nút Đăng xuất nằm trên thanh menu. Máy chủ kiểm tra tài khoản demo, tạo phiên hết hạn sau 30 phút và giữ thông tin bản ghi được chọn trong phiên; không dùng `sessionStorage` làm xác thực. Bản Node dùng cookie HttpOnly, SameSite=Strict; trên Tomcat dùng HttpSession và cookie HttpOnly, tracking-mode COOKIE. Các tab cùng trình duyệt chia sẻ phiên đăng nhập.

Đây vẫn là **bản minh họa dùng dữ liệu giả**: tài khoản thử công khai và `assets/mock-data.js` vẫn chứa bộ dữ liệu mẫu tải về trình duyệt. Không thay dữ liệu trong tệp này bằng thông tin riêng tư. Việc bỏ ID khỏi URL và thêm phiên không biến bộ dữ liệu giả thành hệ thống bảo vệ dữ liệu thật. Khi nối DAO, cần bỏ bộ dữ liệu này khỏi client, kiểm tra quyền sở hữu/phạm vi tại máy chủ cho từng truy vấn và dùng HTTPS khi triển khai.

## Các màn hình và luồng

URL được đặt theo chức năng, không dùng tên file JSP. Ví dụ khi chạy cục bộ:

| Màn hình | Địa chỉ |
| --- | --- |
| Đăng nhập | `http://127.0.0.1:4173/dang-nhap` |
| Trang chủ khách hàng | `http://127.0.0.1:4173/cua-hang` |
| Tìm kiếm mặt hàng | `http://127.0.0.1:4173/san-pham` |
| Chi tiết mặt hàng | `http://127.0.0.1:4173/san-pham/chi-tiet` |
| Tổng quan quản lý | `http://127.0.0.1:4173/quan-ly` |
| Chọn báo cáo | `http://127.0.0.1:4173/quan-ly/bao-cao` |
| Doanh thu khách hàng | `http://127.0.0.1:4173/quan-ly/bao-cao/doanh-thu-khach-hang` |
| Lịch sử mua hàng | `http://127.0.0.1:4173/quan-ly/khach-hang/lich-su-mua-hang` |
| Chi tiết hóa đơn | `http://127.0.0.1:4173/quan-ly/hoa-don/chi-tiet` |

Đây là đường dẫn trong ứng dụng; hostname cục bộ vẫn là `127.0.0.1`. Link được sinh theo origin và context path đang chạy, không cố định cổng hoặc hostname trong giao diện. Từ khóa và kỳ thống kê có thể nằm trong query string. ID sản phẩm, khách hàng, hóa đơn và danh mục không xuất hiện trong URL.

Chọn sản phẩm/khách hàng/hóa đơn gửi POST tới URL cố định, máy chủ kiểm tra phiên/vai trò rồi lưu lựa chọn, chuyển 303 về trang GET sạch. JavaScript gửi POST để giữ kiểm tra Origin trong khi vẫn dùng Referrer-Policy no-referrer. Tải lại giữ lựa chọn trong cùng phiên. Sao chép URL chi tiết sang phiên khác không mang theo bản ghi; cần chọn lại từ danh sách. Link cũ có ID chuyển về danh sách, không tiếp nhận ID từ GET. Các bản ghi được chọn là trạng thái chung của phiên; nếu mở nhiều tab cùng vai trò, lựa chọn mới nhất cho loại trang đó sẽ được dùng.

`assets/routes.js` định nghĩa URL và tạo liên kết đầy đủ; `preview.mjs` ánh xạ URL khi chạy thử, `WEB-INF/web.xml` ánh xạ trên Tomcat. Thẻ `<base>` của JSP lấy `request.getContextPath()` để CSS, ảnh và liên kết hoạt động cả khi ứng dụng đặt tại `/ShopMan/`.

Tất cả nằm tại `WebContent/`:

| File | Nội dung |
| --- | --- |
| `gdDangNhap4.jsp` | Đăng nhập chung, chọn vai trò demo |
| `gdChinhKH4.jsp` | Trang chủ khách hàng, lời chào và menu Tìm mặt hàng |
| `gdTimKiemMatHang4.jsp` | Tìm theo tên, sắp xếp giá/tên, danh sách kết quả và chọn xem chi tiết |
| `gdChiTietMatHang4.jsp` | Ảnh, mã, tên, giá, đơn vị, tồn kho, mô tả |
| `gdChinhQL4.jsp` | Tổng quan toàn cửa hàng: doanh thu đã giao, tổng đơn hàng, đang giao, đã hủy và biểu đồ doanh thu theo tháng; ghi rõ phạm vi toàn bộ thời gian có dữ liệu |
| `gdChonTK4.jsp` | Chọn thống kê khách hàng theo doanh thu |
| `gdTKKhachHang4.jsp` | Khoảng ngày, doanh thu giảm dần |
| `gdLichSuMuaHang4.jsp` | Khách hàng, hóa đơn và tổng doanh thu trong cùng kỳ |
| `gdChiTietHoaDon4.jsp` | Thông tin đơn, dòng mặt hàng, đơn giá mua và tổng tiền |

Luồng khách hàng: đăng nhập → trang chủ → chọn menu Tìm mặt hàng → nhập tên và tìm kiếm → có thể sắp xếp → chọn mặt hàng → xem chi tiết → quay lại đúng từ khóa và thứ tự sắp xếp trước đó. Kết quả hiển thị cố định dưới dạng danh sách. Khi vừa mở trang tìm kiếm hoặc để trống từ khóa, hiển thị toàn bộ mặt hàng. Tìm kiếm mới giữ lựa chọn sắp xếp hiện tại.

Luồng quản lý: đăng nhập → tổng quan → chọn thống kê → doanh thu khách hàng → lịch sử mua → chi tiết hóa đơn → quay lại, giữ kỳ đang chọn.

Dashboard tổng hợp trực tiếp từ đơn hàng qua `ShopData.getStoreOverview()`, tách khỏi bảng xếp hạng doanh thu khách hàng. Tổng đơn hàng tính mọi trạng thái; doanh thu và biểu đồ chỉ tính đơn đã giao, nhóm theo tháng của ngày đặt. Dashboard không có bảng khách hàng hoặc nút mở lịch sử mua hàng; vào Báo cáo để sử dụng các chức năng này.

Các loại thống kê hàng nhập, hàng xuất, nhà cung cấp chỉ được giới thiệu tại trang chọn báo cáo và ghi rõ ngoài phạm vi. Không có CRUD kho, giỏ hàng, đặt mua, đăng ký hoặc luồng nhân viên bán hàng trong bản này. Không phát sinh giao dịch thật.

## Dữ liệu mẫu và quy tắc

- Dữ liệu đặt tại `assets/mock-data.js`: 10 mặt hàng, 4 danh mục, 6 khách hàng và 12 hóa đơn gồm cả tình huống bị loại khỏi báo cáo.
- Kỳ mặc định: **01/09/2026–30/09/2026**. Báo cáo sơ bộ ghi 31/09; bản demo dùng ngày hợp lệ 30/09, giống nội dung cuộc trò chuyện chia sẻ.
- `KH001`: 3 hóa đơn đã giao, **45.000.000 đ**; `KH002`: **32.500.000 đ**. Toàn kỳ: **92.775.000 đ**, 8 hóa đơn, 6 khách hàng.
- Dashboard toàn bộ dữ liệu: **94.210.000 đ**, **12 đơn hàng**, **1 đang giao**, **1 đã hủy**. Doanh thu theo tháng 08/2026, 09/2026 và 10/2026 lần lượt là **185.000 đ**, **92.775.000 đ**, **1.250.000 đ**.
- Chỉ tính hóa đơn có trạng thái `Đã giao`, ngày đặt từ đầu kỳ đến hết cuối kỳ, bao gồm hai ngày biên. Đơn hủy, đang giao và ngoài kỳ đều bị loại.
- Tổng tiền là tổng `quantity × unitPrice`; không dùng giá bán hiện tại để tính lại hóa đơn cũ. Ví dụ DH015 mua laptop với đơn giá 12.500.000 đ, khác giá bán hiện tại 15.000.000 đ.
- Mã `SP001`, `SP002`, `DH001` theo quy ước trong nội dung chia sẻ; các tên, hình, cấu hình và thông tin liên hệ đều minh họa.
- Tìm kiếm chứa từ khóa trong tên, chuẩn hóa khoảng trắng, không phân biệt hoa thường và dấu tiếng Việt. Từ khóa trống hoặc chỉ chứa khoảng trắng hiển thị toàn bộ mặt hàng.
- Kiểm tra ngày bị thiếu, ngày không tồn tại, ngày đầu sau ngày cuối; có trạng thái rỗng và thông báo cho ID không hợp lệ. Hóa đơn phải thuộc đúng khách hàng và kỳ thống kê.
- Ảnh SVG được lưu cục bộ, không tải ảnh/phông chữ ngoài khi chạy. Bố cục đáp ứng máy tính, máy tính bảng và điện thoại.

## Tổ chức và điểm nối Java sau này

Đã tổ chức theo Eclipse Dynamic Web Project: Java trong `src`, JSP và tài nguyên web trong `WebContent`. `Java Resources` và `Libraries` là các mục hiển thị của Eclipse, không phải thư mục vật lý cần tạo.

```text
shopman/
  .project                  # Nhận diện dự án Eclipse
  .classpath                # Source, JRE và Web App Libraries
  .settings/                # Facet, UTF-8 và Deployment Assembly
  src/
    model/                  # Package thực thể; chưa có Entity thật
    dao/                    # Package truy cập CSDL; chưa có DAO thật
    unittest/               # Package kiểm thử Java
  build/classes/            # Kết quả biên dịch, do Eclipse tạo lại
  start.ps1                 # Khởi động xem thử
  preview.mjs               # Máy chủ xem thử và định tuyến
  server-session.mjs        # Phiên máy chủ, vai trò và lựa chọn bản ghi
  package.json
  PROMPT_TICH_HOP_JAVA.md    # Câu lệnh dùng cho lần tích hợp sau
  scripts/check.mjs         # Kiểm tra dữ liệu, cú pháp và file liên kết
  WebContent/
    index.jsp
    gd...4.jsp              # 9 màn hình độc lập
    doDangNhap.jsp           # Xử lý đăng nhập/đăng xuất ở thư mục chung
    WEB-INF/
      web.xml               # Ánh xạ URL, gồm /api/session -> /doDangNhap.jsp
      request-context.jspf  # Kiểm tra phiên và lưu lựa chọn bằng HttpSession
      lib/                  # Đặt JAR kết nối CSDL và JUnit của môn học
    assets/
      style.css             # Giao diện chung
      ui.js                 # Thanh điều hướng, định dạng, phiên demo
      routes.js             # URL theo chức năng và liên kết đầy đủ
      mock-data.js          # Toàn bộ dữ liệu giả + adapter ShopData
      favicon.svg
      products/*.svg        # Hình minh họa sản phẩm
```

### Mở trong Eclipse

1. Dùng Eclipse có Web Tools/Java EE, chọn **File > Import > General > Existing Projects into Workspace**.
2. Chọn thư mục `shopman`, đánh dấu dự án `ShopMan` và bấm **Finish**.
3. Trong Java Resources, `src` chứa các package `model`, `dao`, `unittest`; mỗi package hiện chỉ có `package-info.java` để giữ cấu trúc, chưa có lớp nghiệp vụ.
4. Kiểm tra **Properties > Deployment Assembly**: `/WebContent` đến `/`, `/src` đến `/WEB-INF/classes`. Output Java là `build/classes`.
5. Đặt các JAR JDBC và JUnit được cung cấp cho bài vào `WebContent/WEB-INF/lib`, Refresh dự án và kiểm tra **Java Build Path > Libraries > Web App Libraries**. Nếu cần Add JARs thủ công, chọn chính các file bên trong dự án. Hiện chưa có JAR nào được cung cấp nên thư mục này chỉ có hướng dẫn.
6. Khi chạy JSP thật, chọn server đã cấu hình trong Eclipse. Dự án không gắn đường dẫn JDK/Tomcat riêng của một máy.

Các JSP được giữ ở thư mục chung `WebContent`; thư mục chức năng con là tùy chọn trong yêu cầu. `doDangNhap.jsp` xử lý đăng nhập/đăng xuất và vẫn được ánh xạ tại `/api/session`, nên giao diện giữ nguyên URL. Bản preview Node hỗ trợ cả hai địa chỉ.

Hiện tại mỗi trang gọi adapter `ShopData`, tên phương thức bám thiết kế DAO. Adapter trả về Promise để lần tích hợp sau có thể gọi HTTP mà giữ được luồng giao diện. Không tạo các class Java giả gây xung đột với file bạn bổ sung sau này.

| Adapter hiện tại | Đích Java theo báo cáo |
| --- | --- |
| `getMatHangTheoTen(tuKhoa)` | `ProductDAO4.getMatHangTheoTen(String)` |
| `getMatHangTheoId(productId)` | `ProductDAO4.getMatHangTheoId(int)` |
| `getKhachHangTheoDoanhThu(start,end)` | `TKKhachHangDAO4.getKhachHangTheoDoanhThu(LocalDate,LocalDate)` |
| `getHoaDonCuaKhachHang(customerId,start,end)` | `TKHoaDonDAO4.getHoaDonCuaKhachHang(int,LocalDate,LocalDate)` |
| `getHoaDonTrongKy(orderId,customerId,start,end)` | `SalesOrderDAO4.getHoaDonTrongKy(int,int,LocalDate,LocalDate)` |
| `getChiTietHoaDon(orderId,customerId,start,end)` | Kiểm tra phạm vi hóa đơn trước, rồi `SalesOrderDetailDAO4.getChiTietHoaDon(int)` |

`getCustomer(id)` là tiện ích demo. Khi tích hợp, xác định cách lấy dữ liệu từ Entity/DAO thật đang có; không giả định có sẵn DAO tương ứng. `getChiTietHoaDon` của adapter nhận thêm ngữ cảnh để mô phỏng kiểm tra phạm vi; chữ ký Java theo báo cáo vẫn nhận một `orderId` sau khi hóa đơn đã được kiểm tra.

Phần JSP đã có khung `HttpSession` trong `WEB-INF/request-context.jspf` và API tài khoản thử trong `doDangNhap.jsp`. Khi tích hợp, thay kiểm tra tài khoản thử bằng xác thực thật và kiểm tra bản ghi bằng DAO trước khi lưu lựa chọn hoặc trả dữ liệu. Bản Node kiểm tra cả hóa đơn thuộc khách hàng/kỳ bằng bộ mock ở máy chủ; khung JSP kiểm tra phiên, vai trò và ngữ cảnh lựa chọn, còn kiểm tra dữ liệu thật phải bổ sung bằng DAO. Trình duyệt không gọi JDBC trực tiếp. Có thể dùng JSP render dữ liệu máy chủ hoặc Servlet trả JSON tùy dự án thực tế. Prompt tích hợp có sẵn trong `PROMPT_TICH_HOP_JAVA.md`.

Có thể triển khai giao diện bằng cách sao chép **nội dung** `WebContent` vào thư mục ứng dụng `ShopMan` trong `webapps`, rồi mở `/ShopMan/`. Khi có Java, cần đưa cả kết quả biên dịch vào `WEB-INF/classes`; Eclipse thực hiện bước này qua Deployment Assembly. Giữ nguyên API Jakarta Servlet và descriptor 5.0 hiện có. Phần JSP/HttpSession chưa được chạy trên Tomcat trong lần chuyển cấu trúc này.

## Kiểm tra

```powershell
node scripts/check.mjs
node scripts/check-http.mjs
```

Kiểm tra số liệu báo cáo, tổng từng dòng hóa đơn, ngày biên, sai khách hàng, ngày sai, tìm kiếm, ảnh, cú pháp JavaScript và liên kết. Kiểm tra HTTP bao gồm cookie HttpOnly, vai trò, POST cùng origin, tách biệt giữa các phiên, hóa đơn sai phạm vi, đăng xuất, loại ID khỏi URL và link cũ. Script HTTP dùng máy chủ tạm trên cổng 4187 và tự dừng khi xong. Các kiểm tra chạy bằng Node.js; không thay cho kiểm thử JSP bằng Tomcat hay kiểm thử tích hợp Java sau này.
