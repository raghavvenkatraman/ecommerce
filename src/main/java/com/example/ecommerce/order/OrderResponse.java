package com.example.ecommerce.order;

import java.math.BigDecimal;

public record OrderResponse(long orderId, BigDecimal total) {
}
