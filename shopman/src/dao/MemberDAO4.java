package dao;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Base64;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import model.Customer4;
import model.Manager4;
import model.Member4;

public class MemberDAO4 extends DAO4 {
    private static final String FIND_MEMBER =
        "SELECT m.id, m.username, m.password, m.fullName, m.role, c.customerCode, g.employeeCode"
        + " FROM tblMember4 m LEFT JOIN tblCustomer4 c ON c.id = m.id"
        + " LEFT JOIN tblManager4 g ON g.id = m.id WHERE m.username = ?";

    public Member4 authenticate(String username, String password)
            throws SQLException, GeneralSecurityException {
        String login = username == null ? "" : username.trim();
        if (login.isEmpty() || login.codePointCount(0, login.length()) > 50
                || password == null || password.isEmpty()) {
            return null;
        }

        Member4 member;
        String storedPassword;
        Connection opened = openConnection();
        try (PreparedStatement statement = opened.prepareStatement(FIND_MEMBER)) {
            statement.setString(1, login);
            try (ResultSet row = statement.executeQuery()) {
                if (!row.next()) return null;
                String storedRole = row.getString("role");
                if (!"customer".equals(storedRole) && !"manager".equals(storedRole)) return null;

                int id = row.getInt("id");
                if ("manager".equals(storedRole)) {
                    Manager4 manager = new Manager4(id);
                    manager.setEmployeeCode(row.getString("employeeCode"));
                    member = manager;
                } else {
                    Customer4 customer = new Customer4(id);
                    customer.setCustomerCode(row.getString("customerCode"));
                    member = customer;
                }
                member.setUsername(row.getString("username"));
                member.setFullName(row.getString("fullName"));
                member.setRole(storedRole);
                storedPassword = row.getString("password");
            }
        } finally {
            releaseConnection(opened);
        }
        return matchesPassword(password, storedPassword) ? member : null;
    }

    private static boolean matchesPassword(String password, String storedPassword) throws GeneralSecurityException {
        if (storedPassword == null) return false;
        // Match the seed format: pbkdf2_sha256$iterations$salt$base64Digest.
        String[] parts = storedPassword.split("\\$", -1);
        if (parts.length != 4 || !"pbkdf2_sha256".equals(parts[0]) || parts[2].isEmpty()) return false;

        int iterations;
        byte[] expected;
        try {
            iterations = Integer.parseInt(parts[1]);
            expected = Base64.getDecoder().decode(parts[3]);
        } catch (IllegalArgumentException invalidHash) {
            return false;
        }
        if (iterations <= 0 || expected.length != 32) return false;

        PBEKeySpec spec = new PBEKeySpec(password.toCharArray(), parts[2].getBytes(StandardCharsets.UTF_8), iterations, 256);
        try {
            byte[] actual = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256").generateSecret(spec).getEncoded();
            return MessageDigest.isEqual(expected, actual);
        } finally {
            spec.clearPassword();
        }
    }
}
