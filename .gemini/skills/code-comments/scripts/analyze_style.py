#!/usr/bin/env python3
"""
Analyzes code files to detect existing comment and docstring styles.
"""

import sys
import re
from pathlib import Path
from typing import Dict, List, Optional


def detect_language(file_path: str) -> str:
    """Detect programming language from file extension."""
    ext = Path(file_path).suffix.lower()
    lang_map = {
        '.py': 'python',
        '.js': 'javascript',
        '.jsx': 'javascript',
        '.ts': 'typescript',
        '.tsx': 'typescript',
        '.html': 'html',
        '.htm': 'html',
        '.css': 'css'
    }
    return lang_map.get(ext, 'unknown')


def analyze_python_style(content: str) -> Dict[str, any]:
    """Analyze Python docstring style."""
    # Check for different docstring styles
    google_pattern = r'Args:|Returns:|Raises:|Yields:|Note:|Example:'
    numpy_pattern = r'Parameters\n\s*-{3,}|Returns\n\s*-{3,}'
    sphinx_pattern = r':param |:type |:return:|:rtype:|:raises:'

    google_count = len(re.findall(google_pattern, content))
    numpy_count = len(re.findall(numpy_pattern, content))
    sphinx_count = len(re.findall(sphinx_pattern, content))

    # Detect quote style
    triple_double = content.count('"""')
    triple_single = content.count("'''")

    style = 'pep257'  # default
    if google_count > 0:
        style = 'google'
    elif numpy_count > 0:
        style = 'numpy'
    elif sphinx_count > 0:
        style = 'sphinx'

    quote_style = '"""' if triple_double >= triple_single else "'''"

    return {
        'language': 'python',
        'style': style,
        'quote_style': quote_style,
        'has_docstrings': triple_double > 0 or triple_single > 0,
        'module_docstring': bool(re.match(r'^[\s]*["\'][\s\S]*?["\']', content))
    }


def analyze_javascript_style(content: str) -> Dict[str, any]:
    """Analyze JavaScript/TypeScript comment style."""
    jsdoc_pattern = r'/\*\*[\s\S]*?@(param|returns?|throws?|type|typedef)'
    jsdoc_count = len(re.findall(jsdoc_pattern, content))

    # Check for TSDoc
    tsdoc_pattern = r'@(remarks|example|public|internal)'
    tsdoc_count = len(re.findall(tsdoc_pattern, content))

    has_jsdoc = jsdoc_count > 0
    style = 'tsdoc' if tsdoc_count > 0 else 'jsdoc' if has_jsdoc else 'basic'

    return {
        'language': 'javascript',
        'style': style,
        'has_block_comments': '/**' in content,
        'has_inline_comments': '//' in content
    }


def analyze_html_style(content: str) -> Dict[str, any]:
    """Analyze HTML comment style."""
    comment_pattern = r'<!--[\s\S]*?-->'
    comments = re.findall(comment_pattern, content)

    return {
        'language': 'html',
        'has_comments': len(comments) > 0,
        'comment_count': len(comments),
        'style': 'standard'
    }


def analyze_css_style(content: str) -> Dict[str, any]:
    """Analyze CSS comment style."""
    comment_pattern = r'/\*[\s\S]*?\*/'
    comments = re.findall(comment_pattern, content)

    # Check for section headers
    has_sections = bool(re.search(r'/\*\s*={3,}', content))

    return {
        'language': 'css',
        'has_comments': len(comments) > 0,
        'comment_count': len(comments),
        'has_section_headers': has_sections,
        'style': 'standard'
    }


def analyze_file(file_path: str) -> Dict[str, any]:
    """Analyze a code file and return detected style information."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        return {'error': f"Failed to read file: {e}"}

    language = detect_language(file_path)

    if language == 'python':
        return analyze_python_style(content)
    elif language in ['javascript', 'typescript']:
        return analyze_javascript_style(content)
    elif language == 'html':
        return analyze_html_style(content)
    elif language == 'css':
        return analyze_css_style(content)
    else:
        return {'error': f"Unsupported language: {language}"}


def format_recommendations(analysis: Dict[str, any]) -> str:
    """Format analysis results into human-readable recommendations."""
    if 'error' in analysis:
        return f"Error: {analysis['error']}"

    lang = analysis.get('language', 'unknown')
    lines = [f"Language: {lang.upper()}"]

    if lang == 'python':
        lines.append(f"Detected style: {analysis['style'].upper()}")
        lines.append(f"Quote style: {analysis['quote_style']}")
        lines.append(f"Has docstrings: {analysis['has_docstrings']}")
        lines.append(f"Has module docstring: {analysis['module_docstring']}")

        if not analysis['has_docstrings']:
            lines.append("\nRecommendation: Add docstrings using PEP 257 format")
        else:
            lines.append(f"\nRecommendation: Continue using {analysis['style'].upper()} style")

    elif lang in ['javascript', 'typescript']:
        lines.append(f"Detected style: {analysis['style'].upper()}")
        lines.append(f"Has block comments: {analysis['has_block_comments']}")

        if analysis['style'] == 'basic':
            lines.append("\nRecommendation: Add JSDoc comments for functions")
        else:
            lines.append(f"\nRecommendation: Continue using {analysis['style'].upper()} style")

    elif lang in ['html', 'css']:
        lines.append(f"Has comments: {analysis['has_comments']}")
        if not analysis['has_comments']:
            lines.append("\nRecommendation: Add section comments to organize code")

    return '\n'.join(lines)


def main():
    if len(sys.argv) < 2:
        print("Usage: python analyze_style.py <file_path>")
        sys.exit(1)

    file_path = sys.argv[1]

    if not Path(file_path).exists():
        print(f"Error: File not found: {file_path}")
        sys.exit(1)

    analysis = analyze_file(file_path)
    recommendations = format_recommendations(analysis)

    print(recommendations)


if __name__ == '__main__':
    main()
