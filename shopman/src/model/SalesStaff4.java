package model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/** Model theo bieu do lop thiet ke ShopMan De 36. */
public class SalesStaff4 extends Member4 {
    private String employeeCode;
    private String workShift;

    public SalesStaff4() {}
    public SalesStaff4(int id) { setId(id); }

    public String getEmployeeCode() { return employeeCode; }
    public void setEmployeeCode(String employeeCode) { this.employeeCode = employeeCode; }

    public String getWorkShift() { return workShift; }
    public void setWorkShift(String workShift) { this.workShift = workShift; }

}
