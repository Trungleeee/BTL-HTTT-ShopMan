# ShopMan — Hệ thống quản lý cửa hàng

Ứng dụng web Java JSP kết nối MySQL qua JDBC, phục vụ bài tập lớn Phân tích và thiết kế hệ thống thông tin. Hai chức năng chính đã triển khai là **tìm kiếm mặt hàng** và **thống kê khách hàng theo doanh thu**, kèm đăng nhập, phân quyền và xem chi tiết hóa đơn.

## 1. Công nghệ và cấu trúc

- Java model/DAO, JSP và Jakarta Servlet trên Tomcat 10.1.
- MySQL, JDBC và MySQL Connector/J 8.4.0.
- HTML, CSS và JavaScript thuần để hiển thị giao diện.
- JUnit 4.13.2 cho kiểm thử model/DAO; Python cho kiểm tra HTTP trên Tomcat/MySQL.

```text
BTL/
├── diagram-puml/                  Sơ đồ PlantUML, dự án Visual Paradigm và DDL
│   └── ShopMan4.sql
└── shopman/
    ├── src/
    │   ├── model/                 Các lớp thực thể
    │   ├── dao/                   Truy vấn JDBC và ánh xạ model
    │   └── unittest/              Kiểm thử Java
    ├── WebContent/
    │   ├── *View*.jsp             Các màn hình
    │   ├── SessionHandler.jsp     Đăng nhập và đăng xuất
    │   ├── WEB-INF/
    │   │   ├── web.xml            Định tuyến và cấu hình session
    │   │   ├── request-context.jspf
    │   │   ├── database-context.jspf
    │   │   └── lib/               JDBC driver, JUnit và thư viện đi kèm
    │   └── assets/                CSS, JavaScript và tài nguyên giao diện
    ├── scripts/                   Các chương trình kiểm tra
    ├── .runtime/                  Tomcat cục bộ, không đưa vào Git
    ├── build/classes/             Kết quả biên dịch, không đưa vào Git
    ├── db.properties.example      Mẫu cấu hình MySQL
    ├── start.ps1                  Điểm khởi động
    ├── start-mysql.ps1            Biên dịch, triển khai và chạy Tomcat
    └── stop-mysql.ps1             Dừng Tomcat do script khởi động
```

## 2. Chuẩn bị môi trường

Cần Windows/PowerShell, **JDK 17 trở lên**, MySQL đang chạy và Tomcat 10.1 đặt trong `shopman/.runtime/apache-tomcat-10.1.*`. Bản Tomcat có trên máy phát triển là 10.1.62. Script tìm JDK theo `JAVA_HOME`, nếu không có sẽ tìm trong `C:/Program Files/Java`.

Model và DAO được biên dịch bằng `javac --release 8`; Tomcat 10.1 vẫn phải chạy bằng JDK 17 trở lên. Thư mục `.runtime` bị Git bỏ qua, cần chuẩn bị riêng khi chuyển dự án sang máy khác.

Node.js 18 trở lên và Python 3 chỉ cần cho các chương trình kiểm tra tương ứng. Chạy ứng dụng JSP không cần `npm install`.

### Tạo cơ sở dữ liệu

1. Tạo database `shopman` với bộ ký tự `utf8mb4` bằng MySQL Workbench hoặc MySQL CLI.
2. Mở và chạy `../diagram-puml/ShopMan4.sql` trên database mới. Tệp bắt đầu bằng `USE shopman;` và tạo các bảng; không tự tạo database.
3. Chuẩn bị dữ liệu tài khoản, mặt hàng và giao dịch để sử dụng các chức năng tương ứng.

Tệp SQL hiện có chỉ chứa cấu trúc bảng, không chứa lệnh `INSERT`. Dự án hiện không kèm `ShopMan4-seed.sql`; ứng dụng cũng không tự tạo tài khoản hay chèn dữ liệu khi khởi động. Chỉ chạy DDL một lần trên database mới, vì các lệnh `CREATE TABLE` không có `IF NOT EXISTS`.

Đăng nhập yêu cầu bản ghi trong `tblMember4` và bản ghi tương ứng trong `tblCustomer4` hoặc `tblManager4`. Backend hỗ trợ hai vai trò `customer` và `manager`. Mật khẩu phải có định dạng hash sau, thay vì lưu mật khẩu thuần:

```text
pbkdf2_sha256$iterations$salt$base64Digest
```

Hash sử dụng PBKDF2-HMAC-SHA256, salt được mã hóa UTF-8 và digest dài 32 byte. Các tài khoản `khachhang` và `Admin`, mật khẩu `demo123`, là dữ liệu mà script kiểm tra HTTP kỳ vọng; chúng không được tạo sẵn bởi DDL.

### Cấu hình kết nối

Sao chép `db.properties.example` ra ngoài repository, mặc định script đọc `%USERPROFILE%/shopman-db.properties`. Điền thông tin kết nối thực tế:

```properties
url=jdbc:mysql://127.0.0.1:3306/shopman?characterEncoding=UTF-8
user=YOUR_MYSQL_USER
password=YOUR_MYSQL_PASSWORD
```

Tệp `shopman/db.properties` cục bộ được Git bỏ qua, nhưng script khởi động không tự chọn tệp đó; muốn dùng phải truyền `-DbConfig`.

DAO hỗ trợ các cấu hình sau, với thứ tự ưu tiên giá trị: Java system property → biến môi trường → giá trị trong tệp properties.

| Nội dung | Java system property | Biến môi trường | Khóa trong tệp |
| --- | --- | --- | --- |
| Đường dẫn cấu hình | `shopman.db.config` | `SHOPMAN_DB_CONFIG` | — |
| JDBC URL | `shopman.jdbc.url` | `SHOPMAN_JDBC_URL` | `url` |
| Tài khoản MySQL | `shopman.jdbc.user` | `SHOPMAN_JDBC_USER` | `user` |
| Mật khẩu MySQL | `shopman.jdbc.password` | `SHOPMAN_JDBC_PASSWORD` | `password` |

`start-mysql.ps1` yêu cầu tệp cấu hình tồn tại và truyền đường dẫn đó qua `shopman.db.config`. Không đưa cấu hình chứa mật khẩu thực vào Git.

## 3. Chạy và dừng ứng dụng

Các lệnh dưới đây chạy từ thư mục **BTL**.

```powershell
powershell -ExecutionPolicy Bypass -File .\shopman\start.ps1
```

Mở [trang đăng nhập](http://127.0.0.1:8080/shopman/dang-nhap). Script biên dịch model/DAO, sao chép `WebContent` và các lớp đã biên dịch vào `webapps/shopman`, rồi khởi động Tomcat chỉ trên `127.0.0.1`.

Dùng cấu hình riêng, đổi cổng và không tự mở trình duyệt:

```powershell
powershell -ExecutionPolicy Bypass -File .\shopman\start-mysql.ps1 -DbConfig .\shopman\db.properties -Port 8081 -NoBrowser
```

Khi dùng cổng 8081, địa chỉ là [trang đăng nhập trên cổng 8081](http://127.0.0.1:8081/shopman/dang-nhap).

Dừng ứng dụng:

```powershell
powershell -ExecutionPolicy Bypass -File .\shopman\stop-mysql.ps1
```

Sau khi sửa Java/JSP/CSS/JavaScript, dừng rồi khởi động lại để triển khai bản mới. Nếu ứng dụng đã chạy, script khởi động chỉ trả địa chỉ hiện tại và không sao chép lại source. Script dừng dựa vào `shopman.pid`, dành cho Tomcat được script khởi động.

Nhật ký nằm trong `shopman/.runtime/apache-tomcat-10.1.*/logs/`, gồm `shopman-out.log` và `shopman-error.log` khi chạy bằng script.

## 4. Màn hình và quyền truy cập

Các đường dẫn trong bảng được đặt sau `/shopman`.

| JSP | Đường dẫn | Quyền |
| --- | --- | --- |
| `LoginView.jsp` | `/dang-nhap` | Chưa đăng nhập |
| `CustomerHomeView4.jsp` | `/cua-hang` | Khách hàng |
| `ProductSearchView4.jsp` | `/san-pham` | Khách hàng |
| `ProductDetailView4.jsp` | `/san-pham/chi-tiet` | Khách hàng |
| `ManagerHomeView4.jsp` | `/quan-ly` | Quản lý |
| `StatisticsSelectionView4.jsp` | `/quan-ly/bao-cao` | Quản lý |
| `CustomerRevenueStatisticsView4.jsp` | `/quan-ly/bao-cao/doanh-thu-khach-hang` | Quản lý |
| `CustomerPurchaseHistoryView4.jsp` | `/quan-ly/khach-hang/lich-su-mua-hang` | Quản lý |
| `SalesOrderDetailView4.jsp` | `/quan-ly/hoa-don/chi-tiet` | Quản lý |

`POST /api/session` được ánh xạ tới `SessionHandler.jsp` để đăng nhập và đăng xuất, trả JSON. GET tới endpoint này trả 405. Vai trò được xác định từ CSDL sau khi xác minh mật khẩu. Đăng nhập thành công hủy session cũ và tạo session mới; đăng xuất hủy session hiện tại.

Session dùng cookie `JSESSIONID` với `HttpOnly`, hết hạn sau 30 phút không hoạt động. Các POST đăng nhập và chọn bản ghi kiểm tra `Origin` cùng nguồn. Người chưa đăng nhập hoặc không đúng vai trò được chuyển về đăng nhập khi dùng GET; POST không đủ quyền trả 403.

## 5. Kiến trúc xử lý dữ liệu

```text
Trình duyệt → JSP/include → DAO → MySQL → model
                      → JSON trong trang → JavaScript dựng giao diện
```

- `WEB-INF/request-context.jspf`: nhận diện tuyến, kiểm tra phiên/vai trò, kiểm tra dữ liệu lựa chọn và lưu lựa chọn vào session.
- `WEB-INF/database-context.jspf`: gọi DAO theo màn hình, quản lý danh sách hóa đơn trong session và ánh xạ dữ liệu cần hiển thị.
- `assets/database-data.js`: đọc dữ liệu JSON đã được JSP nhúng trong trang; các hàm `ShopData` không tự gọi lại MySQL hay tạo request API riêng.
- `assets/routes.js` và `assets/ui.js`: định tuyến phía giao diện, dựng form chọn bản ghi, hiển thị dữ liệu và thông báo.

Các JSP dùng static include nên phần xử lý trong hai tệp `.jspf` được thực thi như một phần của trang JSP. Vì vậy, mô tả “JSP gọi DAO” bao gồm đoạn xử lý trong include. JSP tắt EL để giữ nguyên cú pháp `${...}` trong JavaScript template literal.

ID của bản ghi được gửi bằng POST, lưu vào session rồi chuyển hướng 303 về URL màn hình không chứa ID. GET tiếp theo đọc lựa chọn từ session. Khoảng ngày thống kê có thể nằm trên URL; ID khách hàng/hóa đơn không nằm trên URL.

## 6. Tìm kiếm mặt hàng

1. Khách hàng đăng nhập và mở `ProductSearchView4.jsp`.
2. Trang gọi `ProductDAO4.getProductsByKeyword(keyword)`. Khi vừa mở hoặc từ khóa chỉ có khoảng trắng, hệ thống lấy tất cả mặt hàng.
3. Người dùng nhập tên để lọc kết quả; giao diện hỗ trợ sắp xếp mặc định, giá tăng/giảm và tên A–Z.
4. Khi chọn mặt hàng, `productId` được gửi bằng POST và lưu trong session.
5. `ProductDetailView4.jsp` gọi `ProductDAO4.getProductById(id)` và hiển thị chi tiết hoặc thông báo không tìm thấy.

Truy vấn dùng prepared statement. Giao diện tìm kiếm hiện không hiển thị bộ lọc danh mục.

## 7. Thống kê khách hàng theo doanh thu

Trong mô tả nghiệp vụ, `startDate` và `endDate` tương ứng với tham số HTTP `ngayBatDau` và `ngayKetThuc`, định dạng `yyyy-MM-dd`. DAO nhận ngày dưới dạng `LocalDate`.

### Kịch bản xử lý

1. Tại `ManagerHomeView4.jsp`, quản lý chọn chức năng **Thống kê** trên menu.
2. Trình duyệt mở `StatisticsSelectionView4.jsp` và hiển thị các loại thống kê.
3. Quản lý chọn **Khách hàng theo doanh thu** để mở `CustomerRevenueStatisticsView4.jsp`.
4. Trang hiển thị hai ô ngày để trống và nút **Xem thống kê**. Khi chưa nhập ngày, hệ thống chưa truy vấn báo cáo.
5. Quản lý nhập khoảng ngày và chọn **Xem thống kê**.
6. Giao diện và backend kiểm tra ngày hợp lệ, đầy đủ và `startDate <= endDate`.
7. Trang gọi `CustomerRevenueStatisticsDAO4.getCustomerRevenueStatistics(startDate, endDate)`.
8. DAO lấy các hóa đơn **Đã giao** có **ngày đặt hàng** trong kỳ, tổng hợp doanh thu theo khách hàng và trả `CustomerRevenueStatistics4[]`, sắp xếp doanh thu giảm dần.
9. Trang hiển thị khách hàng, số hóa đơn và doanh thu; mặc định **Doanh thu giảm dần**. Người dùng có thể đổi sang tăng dần trên giao diện.
10. Quản lý chọn khách hàng. Trang gửi `customerId` cùng khoảng ngày bằng POST tới `CustomerPurchaseHistoryView4.jsp`; backend lưu lựa chọn và chuyển hướng về trang lịch sử.
11. Trang lịch sử gọi `SalesOrderDAO4.getOrdersByCustomer(customerId, startDate, endDate)`.
12. DAO lấy các hóa đơn **Đã giao** của khách trong kỳ, tính tổng từng hóa đơn từ chi tiết và trả `SalesOrder4[]`, sắp xếp ngày đặt giảm dần rồi ID giảm dần.
13. Trang lấy thông tin khách hàng từ model hóa đơn, lưu mảng hóa đơn cùng ngữ cảnh khách hàng/kỳ vào session và hiển thị lịch sử mua hàng.
14. Quản lý chọn hóa đơn. Trang gửi `orderId`, `customerId` và khoảng ngày bằng POST tới `SalesOrderDetailView4.jsp`.
15. Backend đối chiếu lựa chọn với khách hàng/kỳ của trang lịch sử hiện tại, lưu lựa chọn hóa đơn rồi chuyển hướng về trang chi tiết.
16. Trang chi tiết đọc `SalesOrder4[]` từ session, kiểm tra ngữ cảnh khách hàng/kỳ và tìm đối tượng có ID bằng `orderId`, đúng khách hàng.
17. Nếu không tìm được hóa đơn hợp lệ trong session, trang hiển thị thông báo và nút **Quay lại lịch sử mua hàng**.
18. Nếu tìm được, trang gọi `SalesOrderDetailDAO4.getOrderDetails(orderId)` để lấy `SalesOrderDetail4[]`; mỗi dòng tham chiếu `Product4` tương ứng.
19. Trang hiển thị thông tin chung từ chính `SalesOrder4` đã lưu trong session, các dòng mặt hàng và tổng tiền tính từ các dòng chi tiết vừa tải.

### Quy tắc tính doanh thu

- Chỉ tính trạng thái `Đã giao`; không tính hóa đơn đang giao hoặc đã hủy.
- Lọc theo `orderDate` (ngày đặt hàng), tính cả ngày bắt đầu và toàn bộ ngày kết thúc. SQL dùng `orderDate >= startDate 00:00` và `orderDate < (endDate + 1 ngày) 00:00`.
- Thành tiền mỗi dòng bằng `quantity × unitPrice`; sử dụng đơn giá giao dịch đã lưu, không sử dụng giá bán hiện tại của mặt hàng.
- Tổng tiền hóa đơn bằng tổng các dòng chi tiết; doanh thu khách hàng bằng tổng các hóa đơn đủ điều kiện.
- DAO tổng hợp chi tiết theo hóa đơn trước khi thống kê để không đếm một hóa đơn nhiều lần.
- Không có hóa đơn đủ điều kiện thì báo cáo trả danh sách trống. Theo truy vấn JOIN hiện tại, hóa đơn phải có dòng chi tiết mới được đưa vào thống kê/lịch sử.
- Trạng thái tính doanh thu có thể cấu hình bằng `shopman.delivered.status` hoặc `SHOPMAN_DELIVERED_STATUS`; mặc định là `Đã giao`.

### Dữ liệu trong session

| Khóa | Nội dung |
| --- | --- |
| `shopmanUser` | Vai trò, họ tên và mã nghiệp vụ của người đăng nhập |
| `shopman.product` | ID mặt hàng và lựa chọn tìm kiếm liên quan |
| `shopman.purchaseHistory` | `customerId`, `ngayBatDau`, `ngayKetThuc` và lựa chọn sắp xếp nếu có |
| `shopman.historyOrders` | Mảng `SalesOrder4[]` lấy khi mở trang lịch sử |
| `shopman.historyPeriod` | Chuỗi ngữ cảnh `customerId:startDate:endDate` |
| `shopman.invoice` | `orderId`, `customerId` và khoảng ngày của hóa đơn được chọn |

Trang chi tiết **không truy vấn lại thống kê khách hàng hay danh sách hóa đơn**. Thông tin chung của hóa đơn là dữ liệu tại thời điểm tải lịch sử; các dòng chi tiết được đọc từ MySQL khi mở trang chi tiết. Muốn lấy lại thông tin chung mới nhất, quay về lịch sử để tải lại danh sách.

Mỗi session lưu một danh sách lịch sử hiện tại. Nếu đổi khách hàng/kỳ ở tab khác, lựa chọn hóa đơn từ tab cũ có thể không còn khớp. Session hết hạn yêu cầu đăng nhập và chọn lại từ danh sách. Nếu khách hàng/kỳ không còn hóa đơn khi tải lịch sử, backend hiện trả thông báo lựa chọn không hợp lệ.

## 8. Kiểm tra

### Tomcat/MySQL

Khi Tomcat đã chạy và CSDL có tài khoản kiểm tra:

```powershell
python .\shopman\scripts\check-mysql.py
```

Script kiểm tra đăng nhập, phân quyền, sản phẩm, khoảng ngày, lịch sử và chi tiết hóa đơn. Phần giao dịch dùng kỳ **01/09/2026–30/09/2026**; nếu không có hóa đơn đã giao trong kỳ, phần kiểm tra hóa đơn có dữ liệu sẽ được bỏ qua. Script không ghi dữ liệu nghiệp vụ vào MySQL; nó tạo phiên đăng nhập và thay đổi lựa chọn trong session.

Đổi địa chỉ kiểm tra khi chạy cổng khác:

```powershell
$env:SHOPMAN_TEST_BASE = 'http://127.0.0.1:8081/shopman'
python .\shopman\scripts\check-mysql.py
```

**Giới hạn hiện tại:** script còn kiểm tra trường `data.overview` của dashboard, trong khi trang chủ quản lý hiện chỉ hiển thị lời chào và backend không cấp trường này. Chạy toàn bộ script có thể dừng ở `KeyError: 'overview'` trước khi tới kiểm tra báo cáo.

### Model và DAO bằng JUnit

Có 13 kiểm thử trong `unittest.ModelDAO4Test`, dùng JDBC doubles để kiểm tra ánh xạ, điều kiện truy vấn, đơn giá lịch sử và quy tắc model. Chúng không thay thế kiểm tra kết nối MySQL thật.

Ví dụ biên dịch và chạy bằng JDK trong PowerShell:

```powershell
$shopmanJdk = 'C:\Program Files\Java\jdk-25'
$shopmanSources = Get-ChildItem .\shopman\src\model, .\shopman\src\dao, .\shopman\src\unittest -Filter *.java -Recurse | ForEach-Object { $_.FullName }
New-Item -ItemType Directory -Path .\shopman\build\classes -Force | Out-Null
& "$shopmanJdk\bin\javac.exe" --release 8 -encoding UTF-8 -cp '.\shopman\WebContent\WEB-INF\lib\*' -d .\shopman\build\classes @shopmanSources
& "$shopmanJdk\bin\java.exe" -cp '.\shopman\build\classes;.\shopman\WebContent\WEB-INF\lib\*' org.junit.runner.JUnitCore unittest.ModelDAO4Test
```

Thay `$shopmanJdk` bằng đường dẫn JDK trên máy. `TestConnection.java` là chương trình thử kết nối riêng và hiện gán cứng đường dẫn cấu hình của máy phát triển; cần sửa đường dẫn trước khi dùng trên máy khác.

### Các kiểm tra JavaScript cũ

```powershell
node .\shopman\scripts\check.mjs
node .\shopman\scripts\check-http.mjs
```

`check.mjs` kiểm tra dữ liệu mẫu, định tuyến, cú pháp JavaScript và tham chiếu tài nguyên; hiện có thể dừng vì thiếu `WebContent/assets/products/laptop.svg`. `check-http.mjs` và lệnh `npm start` vẫn tham chiếu `preview.mjs`, nhưng tệp này không có trong source hiện tại. `start-preview.ps1` cũng không có. Sử dụng Tomcat để chạy và kiểm tra ứng dụng JSP/DAO thực tế.

## 9. Xử lý lỗi và phạm vi hiện tại

| Hiện tượng | Cách kiểm tra |
| --- | --- |
| Không tìm thấy cấu hình MySQL | Tạo `%USERPROFILE%/shopman-db.properties` hoặc truyền `-DbConfig` tới tệp đang có |
| Cổng 8080 đang được dùng | Dừng đúng tiến trình cũ hoặc dùng `-Port 8081` |
| Tomcat không khởi động | Kiểm tra JDK, vị trí Tomcat và nhật ký trong `.runtime/.../logs/` |
| Không đăng nhập được | Kiểm tra dữ liệu `tblMember4`, vai trò, bản ghi khách hàng/quản lý và định dạng hash mật khẩu |
| Không thể tải dữ liệu MySQL | Kiểm tra MySQL đang chạy, JDBC URL, tài khoản, quyền truy cập và cấu trúc bảng |
| Báo cáo không có dữ liệu | Kiểm tra kỳ thống kê, `orderDate`, trạng thái `Đã giao` và các dòng chi tiết |
| Hóa đơn/lựa chọn không hợp lệ | Quay lại bảng thống kê, chọn khách hàng rồi chọn hóa đơn trong cùng kỳ |
| Sửa source nhưng giao diện chưa đổi | Dừng rồi khởi động lại để triển khai source mới |

Các mục **Hàng nhập**, **Hàng xuất** và **Nhà cung cấp** trên trang chọn thống kê hiện ghi **Chưa có**. Các model giỏ hàng, nhập hàng và nhà cung cấp chưa đồng nghĩa với việc đã có đầy đủ luồng giao diện tương ứng.

`SalesOrderDAO4.getStoreOverview()` vẫn tồn tại trong DAO, nhưng chưa được nối với trang chủ quản lý hiện tại. Khi MySQL lỗi, ứng dụng hiển thị lỗi và không tự chuyển sang dữ liệu giả.
