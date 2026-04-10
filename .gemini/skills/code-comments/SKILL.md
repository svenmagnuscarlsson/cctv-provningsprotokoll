---
name: code-comments
description: Comprehensive code documentation tool for adding high-quality comments and docstrings to code files. Supports Python, JavaScript/TypeScript, HTML, and CSS with automatic style detection. Use when users request: (1) Adding comments or documentation to code, (2) Writing docstrings for functions/methods, (3) Adding file/module overview comments, (4) Documenting undocumented code, or (5) Improving existing code documentation.
---

# Code Comments Skill

Add professional, well-structured comments and documentation to code files.

## Workflow

When asked to add comments to code:

1. **Read the code file** to understand its structure and existing style
2. **Detect comment style** using `scripts/analyze_style.py` to identify:
   - Existing documentation format (if any)
   - Language-specific conventions
   - Project-specific patterns
3. **Analyze what needs documentation**:
   - Functions/methods without docstrings
   - Files without module-level documentation
   - Complex logic that would benefit from explanation
4. **Write documentation** following the detected style:
   - Match indentation and formatting
   - Use appropriate documentation format for the language
   - Focus on WHY, not just WHAT (avoid stating the obvious)
5. **Apply changes** using Edit tool to add documentation

## Comment Quality Guidelines

### What to Document

- **Purpose and intent**: Why does this function/module exist?
- **Parameters**: What each parameter means, expected types, constraints
- **Return values**: What the function returns and when
- **Side effects**: What the function changes beyond its return value
- **Exceptions**: What errors can be raised and why
- **Complex logic**: Non-obvious algorithms or business rules

### What NOT to Document

- **Obvious code**: Don't state what the code clearly shows
- **Implementation details**: Focus on the interface, not how it works internally (unless truly complex)
- **Redundant information**: Don't repeat what parameter names already convey

### Style-Specific Guidance

For detailed format specifications and examples, see:
- `references/style-guides.md` - Documentation standards for each language
- `references/examples.md` - Real-world examples of good documentation

## Tools

- **`scripts/analyze_style.py`**: Analyzes code files to detect existing comment/docstring style
  - Usage: `python scripts/analyze_style.py <file_path>`
  - Returns: Detected language, style format, and recommendations
