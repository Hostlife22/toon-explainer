#!/usr/bin/env python3
"""Check JavaScript/Python syntax, JSON and local documentation links for CI.

    python scripts/check_repository.py

Requires Node.js; uses only the Python standard library.
"""
import ast
import concurrent.futures
import json
import re
import subprocess
from pathlib import Path
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parents[1]
EXCLUDED = {'.git', '.venv', 'node_modules', '__pycache__', 'dist', 'renders'}


def headings(path):
    found = set()
    counts = {}
    for line in re.sub(r'```.*?```', '', path.read_text(), flags=re.S).splitlines():
        if re.match(r'#{1,6} ', line):
            title = re.sub(r'^#{1,6} ', '', line).strip().lower()
            slug = re.sub(r'[^\w\s-]', '', title).replace(' ', '-')
            index = counts.get(slug, 0)
            counts[slug] = index + 1
            found.add(slug + (f'-{index}' if index else ''))
    return found


def check(path):
    errors = []
    name = path.relative_to(ROOT)
    try:
        text = path.read_text()
        if path.suffix == '.py':
            ast.parse(text, filename=str(name))
        elif path.suffix == '.json':
            json.loads(text)
        elif path.suffix == '.js':
            result = subprocess.run(['node', '--check', str(path)], capture_output=True, text=True)
            if result.returncode:
                errors.append(f'{name}: {result.stderr.strip()}')
        elif path.suffix == '.md':
            prose = re.sub(r'```.*?```', '', text, flags=re.S)
            for match in re.finditer(r'\]\(([^\s)]+)\)|(?:src|href)="([^"]+)"', prose):
                target = (match[1] or match[2]).strip('<>')
                if re.match(r'[a-zA-Z][a-zA-Z0-9+.-]*:', target) or target.startswith('//'):
                    continue
                address, _, anchor = target.partition('#')
                dest = path.parent / unquote(address) if address else path
                if not dest.exists():
                    errors.append(f'{name}: missing link target {target}')
                elif anchor and dest.suffix == '.md' and unquote(anchor) not in headings(dest):
                    errors.append(f'{name}: missing heading {target}')
    except (SyntaxError, ValueError, OSError) as exc:
        errors.append(f'{name}: {exc}')
    return errors


def main():
    files = sorted(p for p in ROOT.rglob('*') if p.is_file()
                   and not EXCLUDED.intersection(p.relative_to(ROOT).parts)
                   and p.suffix in {'.py', '.js', '.json', '.md'})
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        errors = [error for group in pool.map(check, files) for error in group]
    if errors:
        raise SystemExit('\n'.join(errors))
    print(f'Checked {len(files)} source and documentation files; no errors.')


if __name__ == '__main__':
    main()
