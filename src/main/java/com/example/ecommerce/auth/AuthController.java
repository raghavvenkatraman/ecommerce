package com.example.ecommerce.auth;

import java.util.Map;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.security.web.authentication.session.SessionAuthenticationStrategy;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.CsrfTokenRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.ecommerce.auth.AccountRepository.Account;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

	private final AuthService authService;
	private final AccountRepository accountRepository;
	private final SecurityContextRepository securityContextRepository;
	private final SessionAuthenticationStrategy sessionAuthenticationStrategy;
	private final SecurityContextLogoutHandler logoutHandler;
	private final CsrfTokenRepository csrfTokenRepository;

	public AuthController(
			AuthService authService,
			AccountRepository accountRepository,
			SecurityContextRepository securityContextRepository,
			SessionAuthenticationStrategy sessionAuthenticationStrategy,
			SecurityContextLogoutHandler logoutHandler,
			CsrfTokenRepository csrfTokenRepository) {
		this.authService = authService;
		this.accountRepository = accountRepository;
		this.securityContextRepository = securityContextRepository;
		this.sessionAuthenticationStrategy = sessionAuthenticationStrategy;
		this.logoutHandler = logoutHandler;
		this.csrfTokenRepository = csrfTokenRepository;
	}

	@GetMapping("/csrf")
	public Map<String, String> csrf(CsrfToken csrfToken) {
		return Map.of("token", csrfToken.getToken(), "headerName", csrfToken.getHeaderName());
	}

	@PostMapping("/register")
	public AccountResponse register(
			@RequestBody RegistrationRequest request,
			HttpServletRequest httpRequest,
			HttpServletResponse httpResponse) {
		return establishSession(authService.register(request), httpRequest, httpResponse);
	}

	@PostMapping("/login")
	public AccountResponse login(
			@RequestBody LoginRequest request,
			HttpServletRequest httpRequest,
			HttpServletResponse httpResponse) {
		return establishSession(authService.login(request), httpRequest, httpResponse);
	}

	@GetMapping("/me")
	public ResponseEntity<?> currentAccount(Authentication authentication) {
		if (authentication == null || !authentication.isAuthenticated()) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
					.body(Map.of("message", "Sign in to continue."));
		}
		Account account = accountRepository.findByEmail(authentication.getName()).orElse(null);
		if (account == null) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
					.body(Map.of("message", "Sign in to continue."));
		}
		return ResponseEntity.ok(toResponse(account));
	}

	@PostMapping("/logout")
	public ResponseEntity<Void> logout(
			Authentication authentication,
			HttpServletRequest request,
			HttpServletResponse response) {
		logoutHandler.logout(request, response, authentication);
		csrfTokenRepository.saveToken(null, request, response);
		return ResponseEntity.noContent().build();
	}

	private AccountResponse establishSession(
			Authentication authentication,
			HttpServletRequest request,
			HttpServletResponse response) {
		sessionAuthenticationStrategy.onAuthentication(authentication, request, response);
		SecurityContext context = SecurityContextHolder.createEmptyContext();
		context.setAuthentication(authentication);
		SecurityContextHolder.setContext(context);
		securityContextRepository.saveContext(context, request, response);

		Account account = accountRepository.findByEmail(authentication.getName())
				.orElseThrow(() -> new IllegalStateException("The account could not be loaded."));
		return toResponse(account);
	}

	private AccountResponse toResponse(Account account) {
		return new AccountResponse(account.id(), account.name(), account.email());
	}
}
