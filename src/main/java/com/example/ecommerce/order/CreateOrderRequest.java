package com.example.ecommerce.order;

import java.util.List;
//record -> special kind of class (java 16) better version of normal class
public record CreateOrderRequest(String address,List<OrderItemRequest> items) {
	public record OrderItemRequest(Long productId, Integer quantity) {
		
	}
}
