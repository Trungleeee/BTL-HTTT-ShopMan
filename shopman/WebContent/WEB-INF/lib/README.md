# Thư viện Java

Đặt các file JAR kết nối CSDL và JUnit của môn học tại đây.
Dự án hiện chưa có file JAR được cung cấp và chưa sử dụng JDBC/JUnit.

Eclipse đã được cấu hình `Web App Libraries` trong `.classpath` để nhận thư viện
từ `WebContent/WEB-INF/lib`. Sau khi thêm JAR, Refresh dự án và kiểm tra tại
Properties > Java Build Path > Libraries > Web App Libraries.

Nếu cần thêm thủ công, chọn Add JARs và trỏ tới chính các file trong thư mục này;
không tham chiếu tới đường dẫn thư viện riêng trên máy khác. Nếu JUnit có JAR
phụ thuộc đi kèm, đặt chúng tại đây cùng với JAR JUnit.
