# Rate Limiting Interceptor with NestJS

This project implements a rate-limiting interceptor using NestJS. The rate limiter restricts the number of requests a user can make within a certain period, helping to prevent abuse and ensure fair usage of the server resources.

## Project Structure

The project follows the standard NestJS structure with the addition of a custom rate-limiting interceptor. Below is an overview of the key components:

- **`src/app.module.ts`**: The root module that imports necessary modules and sets up providers, including the Redis client and rate limiting services.
- **`src/app.controller.ts`**: The main controller that handles incoming HTTP requests and applies the rate-limiting interceptor.
- **`src/app.service.ts`**: A simple service that returns a message, used by the controller.
- **`src/Interceptors/rate-limit/rate-limit.interceptor.ts`**: The rate-limiting interceptor that checks if a user has exceeded their allowed request limit.
- **`src/Interceptors/rate-limit/rate-limit.service.ts`**: The service that interacts with Redis to track and enforce rate limits.
- **`src/Interceptors/rate-limit/utils.ts`**: A utility class with helper functions, such as formatting timestamps.
- **`test/`**: Contains integration and unit tests for various components.

## Rate Limiting Logic

The rate limiting is enforced based on the user's ID (`userId`), which is passed as a query parameter. The rate limiter:

1. Checks if a `userId` is provided. If not, it throws a `BadRequestException`.
2. Checks with Redis whether the user has exceeded their request limit:
   - If the limit is exceeded, it throws a `TooManyRequestsException` and provides a retry time.
   - If the limit is not exceeded, it decrements the remaining request count and allows the request to proceed.

## Tests

### Unit Tests

Unit tests are provided for both the `RateLimitService` and `RateLimitInterceptor`. These tests ensure that:

- The `RateLimitService` correctly tracks and limits user requests.
- The `RateLimitInterceptor` properly intercepts requests and enforces rate limits.

### Integration Tests

An integration test ensures that the rate-limiting functionality works as expected when the entire service is run. The test invokes the endpoint with a user ID and verifies that the service denies requests after the limit is exceeded.

### Running Tests

To run the tests, use the following command:

```bash
npm run test
```
