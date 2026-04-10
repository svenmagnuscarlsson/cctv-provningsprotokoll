# Code Documentation Style Guides

## Python

### PEP 257 (Basic Docstrings)

Standard Python docstring convention. Simple and minimal.

**Structure:**
```python
def function_name(param1, param2):
    """Brief one-line summary.

    Optional longer description that provides more details
    about what the function does.
    """
```

**Key points:**
- Use triple double quotes `"""`
- First line: brief summary, ends with period
- Blank line separates summary from detailed description
- Use imperative mood: "Return" not "Returns"

### Google Style

Popular in Google and many open-source projects. Clear structure with sections.

**Structure:**
```python
def function_name(param1: str, param2: int) -> bool:
    """Brief one-line summary.

    Longer description if needed.

    Args:
        param1: Description of param1.
        param2: Description of param2.

    Returns:
        Description of return value.

    Raises:
        ValueError: When param1 is empty.
    """
```

**Sections:** Args, Returns, Yields, Raises, Note, Example

### NumPy Style

Used in scientific Python community. Similar to Google but with underlines.

**Structure:**
```python
def function_name(param1, param2):
    """Brief one-line summary.

    Longer description.

    Parameters
    ----------
    param1 : str
        Description of param1.
    param2 : int
        Description of param2.

    Returns
    -------
    bool
        Description of return value.
    """
```

### Sphinx Style

ReStructuredText format, used with Sphinx documentation generator.

**Structure:**
```python
def function_name(param1, param2):
    """Brief one-line summary.

    Longer description.

    :param param1: Description of param1
    :type param1: str
    :param param2: Description of param2
    :type param2: int
    :return: Description of return value
    :rtype: bool
    :raises ValueError: When param1 is empty
    """
```

### Module-Level Documentation

```python
"""Module name and brief description.

Longer description of what this module provides.
Can span multiple lines.

Typical usage example:

    from mymodule import MyClass
    obj = MyClass()
    obj.method()
"""

import statements...
```

## JavaScript/TypeScript

### JSDoc

Standard documentation format for JavaScript.

**Structure:**
```javascript
/**
 * Brief one-line summary.
 *
 * Longer description if needed.
 *
 * @param {string} param1 - Description of param1.
 * @param {number} param2 - Description of param2.
 * @returns {boolean} Description of return value.
 * @throws {Error} When param1 is empty.
 */
function functionName(param1, param2) {
    // implementation
}
```

**Common tags:**
- `@param` - Parameter description
- `@returns` (or `@return`) - Return value
- `@throws` (or `@exception`) - Exceptions thrown
- `@type` - Type of variable
- `@typedef` - Custom type definition
- `@example` - Usage example

### TSDoc

TypeScript-specific, extends JSDoc with additional tags.

**Structure:**
```typescript
/**
 * Brief one-line summary.
 *
 * @param param1 - Description (type inferred from TypeScript).
 * @param param2 - Description (type inferred from TypeScript).
 * @returns Description of return value.
 *
 * @remarks
 * Additional implementation notes or warnings.
 *
 * @example
 * ```ts
 * const result = functionName("test", 42);
 * ```
 */
function functionName(param1: string, param2: number): boolean {
    // implementation
}
```

**Additional TSDoc tags:**
- `@remarks` - Detailed notes
- `@public`, `@private`, `@internal` - Access modifiers
- `@deprecated` - Mark as deprecated
- `@see` - Cross-references

### File-Level Documentation

```javascript
/**
 * @fileoverview Brief description of file contents.
 *
 * Longer description of what this module provides.
 *
 * @author Your Name
 */
```

## HTML

### Standard HTML Comments

```html
<!-- Brief description of section -->

<!--
Multi-line comment for more
complex explanations
-->

<!-- ====================
     SECTION: Main Content
     ==================== -->
```

**Best practices:**
- Use section headers for major page areas
- Comment complex structures or non-obvious markup
- Explain why certain HTML is needed (accessibility, browser compat, etc.)
- Don't comment obvious markup

### Common Patterns

```html
<!-- Navigation -->
<nav>...</nav>

<!-- Main content area -->
<main>
    <!-- Hero section -->
    <section class="hero">...</section>

    <!-- Features grid -->
    <section class="features">...</section>
</main>

<!-- Footer -->
<footer>...</footer>
```

## CSS

### Standard CSS Comments

```css
/* Brief description */

/*
 * Multi-line comment
 * for detailed explanations
 */

/* ===========================
   SECTION: Layout
   =========================== */
```

### Organization Patterns

```css
/* =========================
   Base Styles
   ========================= */

/* Reset/Normalize */
* { margin: 0; padding: 0; }

/* Typography */
body { font-family: sans-serif; }


/* =========================
   Components
   ========================= */

/* Button component */
.btn {
    /* Layout */
    display: inline-block;
    padding: 0.5rem 1rem;

    /* Visual */
    background: blue;
    color: white;
}

/* Button variant - primary */
.btn--primary {
    background: darkblue;
}
```

**Best practices:**
- Group related rules with section comments
- Comment non-obvious CSS (z-index rationale, browser fixes)
- Explain magic numbers
- Document component variants
- Use consistent formatting for section headers
