package com.example.ecommerce.order;

import java.math.BigDecimal;
import java.sql.Statement;
import java.util.HashSet;
import java.util.Set;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.ecommerce.order.CreateOrderRequest.OrderItemRequest;

@Service
public class OrderService {

	private static final int MAX_ORDER_ITEMS = 50;

	private final JdbcTemplate jdbcTemplate;

	public OrderService(JdbcTemplate jdbcTemplate) {
		this.jdbcTemplate = jdbcTemplate;
	}

	@Transactional
	public OrderResponse placeOrder(CreateOrderRequest request, String customerEmail) {
		validate(request);
		String customerName = jdbcTemplate.queryForObject(
				"SELECT name FROM customer_accounts WHERE email = ?", String.class, customerEmail);

		BigDecimal total = BigDecimal.ZERO;
		Set<Long> productIds = new HashSet<>();
		for (OrderItemRequest item : request.items()) {
			if (!productIds.add(item.productId())) {
				throw new IllegalArgumentException("Each product can only appear once in an order.");
			}
			total = total.add(loadProduct(item.productId(), item.quantity()).price()
					.multiply(BigDecimal.valueOf(item.quantity())));
		}

		BigDecimal orderTotal = total;
		KeyHolder keyHolder = new GeneratedKeyHolder();
		jdbcTemplate.update(connection -> {
			var statement = connection.prepareStatement("""
					INSERT INTO customer_orders (customer_name, email, shipping_address, total)
					VALUES (?, ?, ?, ?)
					""", Statement.RETURN_GENERATED_KEYS);
			statement.setString(1, customerName);
			statement.setString(2, customerEmail);
			statement.setString(3, request.address().trim());
			statement.setBigDecimal(4, orderTotal);
			return statement;
		}, keyHolder);

		Number generatedId = keyHolder.getKey();
		if (generatedId == null) {
			throw new IllegalStateException("The database did not return an order ID.");
		}
		long orderId = generatedId.longValue();

		for (OrderItemRequest item : request.items()) {
			OrderedProduct product = loadProduct(item.productId(), item.quantity());
			int reserved = jdbcTemplate.update("""
					UPDATE products SET stock = stock - ?
					WHERE id = ? AND stock >= ?
					""", item.quantity(), item.productId(), item.quantity());
			if (reserved != 1) {
				throw new IllegalArgumentException("Not enough stock for " + product.name() + ".");
			}
			jdbcTemplate.update("""
					INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price)
					VALUES (?, ?, ?, ?, ?)
					""", orderId, product.id(), product.name(), item.quantity(), product.price());
		}

		return new OrderResponse(orderId, orderTotal);
	}

	private OrderedProduct loadProduct(long productId, int quantity) {
		var products = jdbcTemplate.query("""
				SELECT id, name, price, stock FROM products WHERE id = ?
				""", (resultSet, rowNumber) -> new OrderedProduct(
				resultSet.getLong("id"),
				resultSet.getString("name"),
				resultSet.getBigDecimal("price"),
				resultSet.getInt("stock")), productId);
		if (products.isEmpty()) {
			throw new IllegalArgumentException("A product in your order is no longer available.");
		}
		OrderedProduct product = products.getFirst();
		if (product.stock() < quantity) {
			throw new IllegalArgumentException("Not enough stock for " + product.name() + ".");
		}
		return product;
	}

	private void validate(CreateOrderRequest request) {
		if (request == null) {
			throw new IllegalArgumentException("Order details are required.");
		}
		if (isBlank(request.address()) || request.address().trim().length() > 500) {
			throw new IllegalArgumentException("Enter a shipping address (up to 500 characters).");
		}
		if (request.items() == null || request.items().isEmpty() || request.items().size() > MAX_ORDER_ITEMS) {
			throw new IllegalArgumentException("An order must contain between 1 and 50 items.");
		}
		for (OrderItemRequest item : request.items()) {
			if (item == null || item.productId() == null || item.productId() < 1
					|| item.quantity() == null || item.quantity() < 1) {
				throw new IllegalArgumentException("Each order item needs a product and a positive quantity.");
			}
		}
	}

	private boolean isBlank(String value) {
		return value == null || value.isBlank();
	}

	private record OrderedProduct(long id, String name, BigDecimal price, int stock) {
	}
}
