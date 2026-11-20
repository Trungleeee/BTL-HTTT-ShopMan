# Thu vien ShopMan

Theo muc 5.1 bai giang (trang PDF 116), cac JAR nam trong `WebContent/WEB-INF/lib`. Eclipse nhan chung qua Web App Libraries, da co container `org.eclipse.jst.j2ee.internal.web.container` trong `.classpath`; khong khai bao trung JAR.

- MySQL Connector/J 8.4.0: JDBC cho Java 8 tro len.
- protobuf-java 3.25.1: dependency duoc POM Connector/J 8.4.0 khai bao.
- JUnit 4.13.2 va hamcrest-core 1.3: bo kiem thu JUnit 4.
- Nguon tai: https://repo.maven.apache.org/maven2/ (com/mysql/mysql-connector-j, com/google/protobuf/protobuf-java, junit/junit, org/hamcrest/hamcrest-core).
- Da doi chieu SHA-1 voi tep checksum cua artifact tren Maven Central va doc duoc noi dung ZIP cua tung JAR. SHA-256 cuc bo duoi day dung de doi chieu ban giao.

| JAR | SHA-256 |
|---|---|
| `hamcrest-core-1.3.jar` | `66fdef91e9739348df7a096aa384a5685f4e875584cce89386a7a47251c4d8e9` |
| `junit-4.13.2.jar` | `8e495b634469d64fb8acfa3495a065cbacc8a0fff55ce1e31007be4c16dc57d3` |
| `mysql-connector-j-8.4.0.jar` | `d77962877d010777cff997015da90ee689f0f4bb76848340e1488f2b83332af5` |
| `protobuf-java-3.25.1.jar` | `48a8e58a1a8f82eff141a7a388d38dfe77d7a48d5e57c9066ee37f19147e20df` |
