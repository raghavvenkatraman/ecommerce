package com.example.ecommerce.auth;

import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class AccountDetailsService implements UserDetailsService {

	private final AccountRepository accountRepository;

	public AccountDetailsService(AccountRepository accountRepository) {
		this.accountRepository = accountRepository;
	}

	@Override
	public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
		AccountRepository.Account account = accountRepository.findByEmail(email)
				.orElseThrow(() -> new UsernameNotFoundException("Account not found."));
		return User.withUsername(account.email())
				.password(account.passwordHash())
				.roles("CUSTOMER")
				.build();
	}
}
