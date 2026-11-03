package com.example.ecommerce.auth;

import java.nio.charset.StandardCharsets;
import java.util.regex.Pattern;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

	private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
	private static final int MAX_PASSWORD_BYTES = 72;

	private final AccountRepository accountRepository;
	private final AuthenticationManager authenticationManager;
	private final PasswordEncoder passwordEncoder;

	public AuthService(
			AccountRepository accountRepository,
			AuthenticationManager authenticationManager,
			PasswordEncoder passwordEncoder) {
		this.accountRepository = accountRepository;
		this.authenticationManager = authenticationManager;
		this.passwordEncoder = passwordEncoder;
	}

	public Authentication login(LoginRequest request) {
		if (request == null || isBlank(request.email()) || isBlank(request.password())) {
			throw new IllegalArgumentException("Enter your email and password.");
		}
		return authenticationManager.authenticate(UsernamePasswordAuthenticationToken.unauthenticated(
				AccountRepository.normalizeEmail(request.email()), request.password()));
	}

	public Authentication register(RegistrationRequest request) {
		validateRegistration(request);
		String email = AccountRepository.normalizeEmail(request.email());
		accountRepository.create(request.name(), email, passwordEncoder.encode(request.password()));
		return authenticationManager.authenticate(
				UsernamePasswordAuthenticationToken.unauthenticated(email, request.password()));
	}

	private void validateRegistration(RegistrationRequest request) {
		if (request == null) {
			throw new IllegalArgumentException("Account details are required.");
		}
		if (isBlank(request.name()) || request.name().trim().length() > 120) {
			throw new IllegalArgumentException("Enter your name (up to 120 characters).");
		}
		if (isBlank(request.email()) || request.email().trim().length() > 254
				|| !EMAIL_PATTERN.matcher(request.email().trim()).matches()) {
			throw new IllegalArgumentException("Enter a valid email address.");
		}
		if (request.password() == null || request.password().length() < 10
				|| request.password().getBytes(StandardCharsets.UTF_8).length > MAX_PASSWORD_BYTES) {
			throw new IllegalArgumentException("Use a password of at least 10 characters and no more than 72 bytes.");
		}
	}

	private boolean isBlank(String value) {
		return value == null || value.isBlank();
	}
}
