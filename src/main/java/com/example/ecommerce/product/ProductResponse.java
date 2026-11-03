package com.example.ecommerce.product;

import java.math.BigDecimal;

public record ProductResponse(
		long id,
		String name,
		String description,
		String category,
		BigDecimal price,
		String imageUrl,
		String badge,
		int stock) {
}
