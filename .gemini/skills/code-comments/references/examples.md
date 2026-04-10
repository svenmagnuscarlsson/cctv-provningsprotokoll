# Documentation Examples

Real-world examples of well-documented code showing best practices.

## Python Examples

### Example 1: Simple Function (PEP 257)

```python
def calculate_discount(price, discount_percent):
    """Calculate the final price after applying a discount.

    The discount is applied as a percentage reduction from the original price.
    """
    discount_amount = price * (discount_percent / 100)
    return price - discount_amount
```

### Example 2: Complex Function (Google Style)

```python
def process_user_data(user_id: str, include_metadata: bool = False) -> dict:
    """Fetch and process user data from multiple sources.

    This function retrieves user information from the database, enriches it
    with data from external APIs, and optionally includes system metadata.

    Args:
        user_id: Unique identifier for the user.
        include_metadata: Whether to include system metadata like timestamps
            and modification history. Defaults to False.

    Returns:
        A dictionary containing the processed user data with keys:
            - 'profile': User profile information
            - 'activity': Recent user activity
            - 'metadata': System metadata (if include_metadata is True)

    Raises:
        UserNotFoundError: If the user_id doesn't exist in the database.
        APIConnectionError: If external API calls fail after retries.

    Example:
        >>> user = process_user_data("user123", include_metadata=True)
        >>> print(user['profile']['name'])
        'John Doe'
    """
    # Implementation...
```

### Example 3: Class Documentation

```python
class PaymentProcessor:
    """Handle payment transactions with multiple payment providers.

    This class abstracts payment processing across different providers
    (Stripe, PayPal, etc.) and handles retries, logging, and error recovery.

    Attributes:
        provider: Name of the payment provider being used.
        api_key: API key for authentication.
        retry_count: Number of times to retry failed transactions.

    Example:
        >>> processor = PaymentProcessor(provider='stripe', api_key='sk_test_...')
        >>> result = processor.charge(amount=1000, currency='USD')
        >>> print(result.status)
        'success'
    """

    def __init__(self, provider: str, api_key: str, retry_count: int = 3):
        """Initialize the payment processor.

        Args:
            provider: Payment provider name ('stripe', 'paypal', etc.).
            api_key: API authentication key.
            retry_count: Max retry attempts for failed transactions.
        """
        self.provider = provider
        self.api_key = api_key
        self.retry_count = retry_count
```

### Example 4: Module Documentation

```python
"""User authentication and authorization module.

This module provides functions and classes for handling user login,
session management, and permission checking. It integrates with both
local database authentication and OAuth providers.

The module supports:
    - Password-based authentication
    - OAuth2 (Google, GitHub)
    - JWT token generation and validation
    - Role-based access control (RBAC)

Typical usage:

    from auth import authenticate, require_permission

    user = authenticate(username, password)
    if user and require_permission(user, 'admin'):
        # Admin operations
        pass
"""

import bcrypt
from datetime import datetime
# ... rest of imports
```

## JavaScript/TypeScript Examples

### Example 1: Simple Function (JSDoc)

```javascript
/**
 * Format a date as a human-readable string.
 *
 * @param {Date} date - The date to format.
 * @param {string} locale - The locale for formatting (e.g., 'en-US').
 * @returns {string} The formatted date string.
 *
 * @example
 * formatDate(new Date(), 'en-US')
 * // Returns: "January 15, 2024"
 */
function formatDate(date, locale) {
    return date.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}
```

### Example 2: Complex Function (TSDoc)

```typescript
/**
 * Fetch and cache user data with automatic retry logic.
 *
 * This function retrieves user data from the API and caches it locally.
 * Failed requests are automatically retried with exponential backoff.
 *
 * @param userId - Unique identifier for the user.
 * @param options - Configuration options for the fetch operation.
 * @returns Promise resolving to the user data.
 *
 * @throws {@link NetworkError}
 * Thrown when network request fails after all retries.
 *
 * @remarks
 * The cache is stored in localStorage and expires after 1 hour.
 * Set `options.forceRefresh` to true to bypass cache.
 *
 * @example
 * ```ts
 * const user = await fetchUserWithCache('user123', {
 *     forceRefresh: false,
 *     timeout: 5000
 * });
 * console.log(user.name);
 * ```
 */
async function fetchUserWithCache(
    userId: string,
    options: FetchOptions = {}
): Promise<UserData> {
    // Implementation...
}
```

### Example 3: Type Definition

```typescript
/**
 * Configuration options for API requests.
 *
 * @typedef {Object} ApiConfig
 * @property {string} baseUrl - Base URL for API endpoints.
 * @property {number} timeout - Request timeout in milliseconds.
 * @property {Object.<string, string>} headers - HTTP headers to include.
 * @property {boolean} retryOnFailure - Whether to retry failed requests.
 */

/**
 * Response from API operations.
 *
 * @interface ApiResponse
 * @property {boolean} success - Whether the operation succeeded.
 * @property {*} data - Response data (type varies by endpoint).
 * @property {string} [error] - Error message if operation failed.
 */
```

### Example 4: React Component

```typescript
/**
 * UserProfile component displays user information and activity.
 *
 * @component
 * @param {Object} props - Component properties.
 * @param {User} props.user - User object containing profile data.
 * @param {boolean} [props.showActivity=true] - Whether to show activity feed.
 * @param {Function} props.onEdit - Callback when edit button is clicked.
 *
 * @example
 * ```tsx
 * <UserProfile
 *     user={currentUser}
 *     showActivity={true}
 *     onEdit={() => setEditMode(true)}
 * />
 * ```
 */
const UserProfile: React.FC<UserProfileProps> = ({
    user,
    showActivity = true,
    onEdit
}) => {
    // Implementation...
};
```

## HTML Examples

### Example: Semantic Structure with Comments

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>User Dashboard</title>
</head>
<body>
    <!-- Skip to main content link for accessibility -->
    <a href="#main-content" class="skip-link">Skip to main content</a>

    <!-- ====================
         Header & Navigation
         ==================== -->
    <header>
        <nav aria-label="Main navigation">
            <!-- Primary navigation -->
            <ul>
                <li><a href="/">Home</a></li>
                <li><a href="/dashboard">Dashboard</a></li>
                <li><a href="/settings">Settings</a></li>
            </ul>
        </nav>
    </header>

    <!-- ====================
         Main Content
         ==================== -->
    <main id="main-content">
        <!-- Hero section with call-to-action -->
        <section class="hero" aria-labelledby="hero-heading">
            <h1 id="hero-heading">Welcome Back!</h1>
            <p>Your personalized dashboard</p>
        </section>

        <!-- Statistics cards grid -->
        <section class="stats" aria-label="Statistics overview">
            <!-- Using explicit ARIA labels since visual layout
                 differs from DOM order for responsive design -->
            <div class="stat-card" aria-label="Total users">
                <h2>1,234</h2>
                <p>Users</p>
            </div>
        </section>
    </main>

    <!-- ====================
         Footer
         ==================== -->
    <footer>
        <p>&copy; 2024 Company Name</p>
    </footer>
</body>
</html>
```

## CSS Examples

### Example: Well-Organized Stylesheet

```css
/* ===========================
   CSS Variables & Configuration
   =========================== */

:root {
    /* Primary colors */
    --color-primary: #3b82f6;
    --color-secondary: #8b5cf6;

    /* Spacing scale - Based on 8px base unit */
    --spacing-xs: 0.5rem;  /* 8px */
    --spacing-sm: 1rem;    /* 16px */
    --spacing-md: 1.5rem;  /* 24px */
    --spacing-lg: 2rem;    /* 32px */

    /* Z-index scale - Prevents z-index conflicts */
    --z-dropdown: 100;
    --z-modal: 200;
    --z-tooltip: 300;
}


/* ===========================
   Base Styles
   =========================== */

/* Apply border-box sizing to all elements
   Makes width calculations more predictable */
*,
*::before,
*::after {
    box-sizing: border-box;
}

body {
    /* System font stack for optimal loading and native feel */
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    line-height: 1.6;
    color: #333;
}


/* ===========================
   Components
   =========================== */

/* Button Component
   Base button styles that can be extended with modifiers */
.btn {
    /* Reset default button styles */
    border: none;
    background: none;
    cursor: pointer;

    /* Layout */
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-sm) var(--spacing-md);

    /* Typography */
    font-weight: 600;
    text-decoration: none;

    /* Visual */
    border-radius: 4px;
    transition: all 0.2s ease;
}

/* Primary button variant */
.btn--primary {
    background: var(--color-primary);
    color: white;
}

.btn--primary:hover {
    /* Darken by 10% on hover */
    filter: brightness(0.9);
}


/* Modal Component
   Overlay modal with backdrop */
.modal {
    /* Position in center of viewport */
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);

    /* Higher z-index than dropdown but lower than tooltip */
    z-index: var(--z-modal);

    /* Sizing */
    max-width: 90vw;
    max-height: 90vh;

    /* Visual */
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.modal__backdrop {
    /* Full viewport overlay */
    position: fixed;
    inset: 0;

    /* Semi-transparent black */
    background: rgba(0, 0, 0, 0.5);

    /* Just below modal */
    z-index: calc(var(--z-modal) - 1);
}


/* ===========================
   Utilities
   =========================== */

/* Screen reader only - Visually hidden but accessible to screen readers */
.sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
}
```

## Best Practices Demonstrated

### Good Comments (WHY, not WHAT)

```python
# Good: Explains the reasoning
# Use exponential backoff to avoid overwhelming the API during outages
retry_delay = 2 ** attempt

# Bad: States the obvious
# Set retry_delay to 2 to the power of attempt
retry_delay = 2 ** attempt
```

```javascript
// Good: Explains non-obvious behavior
// Parse as integer to prevent "10" + "5" = "105" string concatenation
const total = parseInt(input) + 5;

// Bad: Repeats what code shows
// Add 5 to input
const total = parseInt(input) + 5;
```

### Complex Logic Example

```python
def calculate_tax(income, country_code):
    """Calculate income tax based on progressive tax brackets.

    Uses the country's tax bracket system where each portion of income
    is taxed at its corresponding rate. For example, with brackets
    [0-10k: 10%, 10k-50k: 20%, 50k+: 30%], an income of 60k is taxed as:
    10k * 0.1 + 40k * 0.2 + 10k * 0.3 = 12k total tax.

    Args:
        income: Gross income in local currency.
        country_code: ISO country code (e.g., 'US', 'SE').

    Returns:
        Total tax amount in local currency.
    """
    brackets = get_tax_brackets(country_code)
    tax = 0
    remaining = income

    # Process each bracket from lowest to highest
    for bracket in brackets:
        # Amount of income that falls within this bracket
        taxable_in_bracket = min(remaining, bracket.upper_limit - bracket.lower_limit)

        if taxable_in_bracket <= 0:
            break

        # Apply this bracket's rate only to the portion in the bracket
        tax += taxable_in_bracket * bracket.rate
        remaining -= taxable_in_bracket

    return tax
```
