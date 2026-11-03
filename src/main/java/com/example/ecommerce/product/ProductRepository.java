package com.example.ecommerce.product;

import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class ProductRepository {

	private final JdbcTemplate jdbcTemplate;

	public ProductRepository(JdbcTemplate jdbcTemplate) {
		this.jdbcTemplate = jdbcTemplate;
	}

	public List<ProductResponse> findAll() {
		return jdbcTemplate.query("""
				SELECT id, name, description, category, price, image_url, badge, stock
				FROM products
				ORDER BY id
				""", (resultSet, rowNumber) -> new ProductResponse(
				resultSet.getLong("id"),
				resultSet.getString("name"),
				resultSet.getString("description"),
				resultSet.getString("category"),
				resultSet.getBigDecimal("price"),
				resultSet.getString("image_url"),
				resultSet.getString("badge"),
				resultSet.getInt("stock")));
	}
}
