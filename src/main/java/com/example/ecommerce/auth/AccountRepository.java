package com.example.ecommerce.auth;

import java.util.List;
import java.util.Locale;
import java.util.Optional;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

@Repository
public class AccountRepository {

	private final JdbcTemplate jdbcTemplate;

	public AccountRepository(JdbcTemplate jdbcTemplate) {
		this.jdbcTemplate = jdbcTemplate;
	}

	public Optional<Account> findByEmail(String email) {
		List<Account> accounts = jdbcTemplate.query("""
				SELECT id, name, email, password_hash
				FROM customer_accounts
				WHERE email = ?
				""", (resultSet, rowNumber) -> new Account(
				resultSet.getLong("id"),
				resultSet.getString("name"),
				resultSet.getString("email"),
				resultSet.getString("password_hash")), normalizeEmail(email));
		return accounts.stream().findFirst();
	}

	public Account create(String name, String email, String passwordHash) {
		KeyHolder keyHolder = new GeneratedKeyHolder();
		String normalizedEmail = normalizeEmail(email);
		jdbcTemplate.update(connection -> {
			var statement = connection.prepareStatement("""
					INSERT INTO customer_accounts (name, email, password_hash)
					VALUES (?, ?, ?)
					""", java.sql.Statement.RETURN_GENERATED_KEYS);
			statement.setString(1, name.trim());
			statement.setString(2, normalizedEmail);
			statement.setString(3, passwordHash);
			return statement;
		}, keyHolder);
		Number generatedId = keyHolder.getKey();
		if (generatedId == null) {
			throw new IllegalStateException("The database did not return an account ID.");
		}
		return new Account(generatedId.longValue(), name.trim(), normalizedEmail, passwordHash);
	}

	public static String normalizeEmail(String email) {
		return email.trim().toLowerCase(Locale.ROOT);
	}

	public record Account(long id, String name, String email, String passwordHash) {
	}
}
