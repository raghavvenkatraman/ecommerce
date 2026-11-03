# Ecommerce Backend

This project is a Spring Boot-based ecommerce backend for managing product listings, user authentication, and order placement.

It includes:

- Product listing endpoints
- User registration and login
- CSRF-protected security setup for API requests
- Order creation flow
- MySQL-backed persistence

## Tech Stack

- Java 25
- Spring Boot 4.1.2
- Spring Security
- MySQL
- Maven

## Project Structure

```text
src/
├── main/
│   ├── java/com/example/ecommerce
│   │   ├── auth/
│   │   ├── order/
│   │   ├── product/
│   │   ├── ApiExceptionHandler.java
│   │   ├── EcommerceApplication.java
│   │   └── SecurityConfiguration.java
│   └── resources/
│       ├── application.properties
│       ├── schema.sql
│       └── data.sql
└── test/
```

## Prerequisites

Before running the app, make sure you have:

- Java 25 or compatible JDK installed
- Maven installed (or use the Maven wrapper included in the repo)
- MySQL running locally or in a reachable environment

## Configuration

The app reads database settings from environment variables or uses default values defined in `src/main/resources/application.properties`.

Common variables:

```bash
export MYSQL_HOST=localhost
export MYSQL_PORT=3306
export MYSQL_DATABASE=ecommerce
export MYSQL_USER=root
export MYSQL_PASSWORD=your_password
export SERVER_PORT=8080
```

If you do not set these variables, the app will use the defaults defined in the properties file.

## Run the Application

From the project root:

```bash
./mvnw spring-boot:run
```

On Windows:

```bash
mvnw.cmd spring-boot:run
```

The application will start on:

```text
http://localhost:8080
```

## Main API Endpoints

### Authentication

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/csrf`

### Products

- `GET /api/products`

### Orders

- `POST /api/orders`

## Testing

Run the project tests with:

```bash
./mvnw test
```

## Notes

- This project contains a backend API only.
- There is also a separate frontend app under the `ecom/` directory.
- The application uses Spring Security with disabled basic/form login and a custom JSON error response for unauthenticated access.

## License

This project does not currently declare a license.
