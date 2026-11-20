package model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/** Model theo bieu do lop thiet ke ShopMan De 36. */
public class ImportInvoice4 {
    private int id;
    private String invoiceNumber;
    private LocalDateTime importDate;
    private BigDecimal totalAmount = BigDecimal.ZERO;
    private Supplier4 supplier;
    private Manager4 createdBy;
    private List<ImportInvoiceDetail4> details;

    public ImportInvoice4() {}
    public ImportInvoice4(int id) { this.id = id; }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getInvoiceNumber() { return invoiceNumber; }
    public void setInvoiceNumber(String invoiceNumber) { this.invoiceNumber = invoiceNumber; }

    public LocalDateTime getImportDate() { return importDate; }
    public void setImportDate(LocalDateTime importDate) { this.importDate = importDate; }

    /** Tinh tu chi tiet da tai; neu chua tai chi tiet thi dung tong truy van. */
    public BigDecimal getTotalAmount() {
        if (details == null) return totalAmount;
        BigDecimal sum = BigDecimal.ZERO;
        for (ImportInvoiceDetail4 detail : details) sum = sum.add(detail.getLineTotal());
        return sum;
    }
    public void setTotalAmount(BigDecimal totalAmount) { if (totalAmount == null || totalAmount.signum() < 0) throw new IllegalArgumentException("totalAmount must be non-negative"); this.totalAmount = totalAmount; }

    public Supplier4 getSupplier() { return supplier; }
    public void setSupplier(Supplier4 supplier) { this.supplier = supplier; }

    public Manager4 getCreatedBy() { return createdBy; }
    public void setCreatedBy(Manager4 createdBy) { this.createdBy = createdBy; }

    public List<ImportInvoiceDetail4> getDetails() { return details; }
    public void setDetails(List<ImportInvoiceDetail4> details) { this.details = details; }

}
