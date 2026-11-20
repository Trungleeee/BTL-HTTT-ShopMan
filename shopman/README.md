# ShopMan — JSP, DAO và MySQL

## Chạy hệ thống

Từ thư mục BTL:

```powershell
powershell -ExecutionPolicy Bypass -File .\shopman\start.ps1
```

Mở http://127.0.0.1:8080/shopman/dang-nhap.

- Tài khoản trong dữ liệu mẫu `../diagram/ShopMan4-seed.sql` gồm khách hàng `khachhang` và quản lý `Admin`, cùng dùng mật khẩu `demo123`.
- Đăng nhập, dữ liệu sản phẩm, dashboard và báo cáo đều dùng MySQL.
- Dừng: `powershell -ExecutionPolicy Bypass -File .\shopman\stop-mysql.ps1`.
- Khi sửa Java/JSP: dừng rồi chạy lại để biên dịch và triển khai bản mới.

Máy hiện tại đã có Tomcat 10.1.62 trong `.runtime` (không đưa vào Git). Cần JDK 17 trở lên và MySQL đang chạy. Java model/DAO vẫn biên dịch thành bytecode Java 8. Không chạy Tomcat bằng JRE 8.

Tệp cấu hình ngoài dự án: `C:/Users/Lenovo/shopman-db.properties`, gồm `url`, `user`, `password`; xem `db.properties.example`. Không đưa mật khẩu vào source. Có thể chạy `start-mysql.ps1 -DbConfig <đường-dẫn> -Port 8081` để đổi tệp hoặc cổng.

## Luồng dữ liệu

Trình duyệt → JSP → DAO → MySQL → model → dữ liệu JSON của trang → giao diện JavaScript hiện có.

`WEB-INF/request-context.jspf` kiểm tra phiên, vai trò và lựa chọn. `WEB-INF/database-context.jspf` gọi các DAO và chỉ ánh xạ trường cần hiển thị. `assets/database-data.js` cung cấp dữ liệu của trang cho phần dựng giao diện; không chuyển sang dữ liệu mẫu khi MySQL lỗi. JSP tắt EL để các biểu thức `${...}` của JavaScript được giữ nguyên.

`POST /api/session` gọi `MemberDAO4` để tìm tài khoản trong `tblMember4` và xác minh mật khẩu bằng PBKDF2-SHA256. Sau khi xác thực thành công, JSP tạo phiên chứa vai trò, họ tên và mã nghiệp vụ lấy từ MySQL. Giao diện chuyển đến trang chủ tương ứng với vai trò trả về từ backend.

`SalesOrderDAO4.getStoreOverview()` trả dữ liệu tổng hợp dashboard bằng Map. Doanh thu tính từ số lượng × đơn giá trên các hóa đơn đã giao.

## Màn hình

| JSP | Đường dẫn sau `/shopman` |
| --- | --- |
| LoginView.jsp | /dang-nhap |
| CustomerHomeView4.jsp | /cua-hang |
| ProductSearchView4.jsp | /san-pham |
| ProductDetailView4.jsp | /san-pham/chi-tiet |
| ManagerHomeView4.jsp | /quan-ly |
| StatisticsSelectionView4.jsp | /quan-ly/bao-cao |
| CustomerRevenueStatisticsView4.jsp | /quan-ly/bao-cao/doanh-thu-khach-hang |
| CustomerPurchaseHistoryView4.jsp | /quan-ly/khach-hang/lich-su-mua-hang |
| SalesOrderDetailView4.jsp | /quan-ly/hoa-don/chi-tiet |

Khi vừa mở trang tìm kiếm hoặc để trống từ khóa, hiển thị tất cả mặt hàng từ MySQL. Nhập tên để lọc kết quả. Giữ sắp xếp giá/tên và nút chọn chi tiết. Không hiển thị danh mục.

Màn hình thống kê mở với hai ô ngày để trống. Người dùng chọn ngày bắt đầu, ngày kết thúc rồi bấm **Xem thống kê** để tải kết quả. Khách hàng phải xuất hiện trong báo cáo của kỳ đã chọn. Hóa đơn phải nằm trong danh sách lịch sử được lưu ở phiên, đúng khách hàng/kỳ và vẫn hợp lệ khi kiểm tra lại trên MySQL trước khi đọc chi tiết. ID được gửi bằng POST và lưu trong phiên, không đưa vào URL.

Chưa có đơn hàng thì dashboard hiển thị 0 và báo cáo trống. Không tự chèn đơn hàng hoặc thay đổi dữ liệu khi chạy web. Tệp mẫu trong `../diagram/ShopMan4-seed.sql` có thể nhập riêng khi cần dữ liệu minh họa đầy đủ.

## Bản xem trước cũ

`powershell -ExecutionPolicy Bypass -File .\shopman\start-preview.ps1` chạy Node tại cổng 4173, dùng dữ liệu mẫu. Bản này không thực thi JSP/DAO, không dùng để kiểm tra MySQL. `preview.mjs` thay adapter bằng mock chỉ khi chạy bản xem trước.

## Kiểm tra

- `node shopman/scripts/check.mjs`: cú pháp JavaScript, liên kết, định tuyến và dữ liệu mẫu.
- `node shopman/scripts/check-http.mjs`: phiên/định tuyến của bản Node.
- `python shopman/scripts/check-mysql.py`: kiểm tra chỉ đọc trên Tomcat/MySQL đang chạy; kiểm tra lịch sử/chi tiết khi có hóa đơn trong kỳ.
- JUnit: `unittest.ModelDAO4Test`, 12 kiểm thử model/DAO qua JDBC doubles; không thay thế kiểm tra MySQL thật.
