#!/usr/bin/env python3
"""Build source archives and SHA-256 checksums from a committed Git revision.

    python scripts/build_release.py --ref HEAD --out dist
"""
import argparse
import gzip
import hashlib
import shutil
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REQUIRED = {
    'SKILL.md', 'README.md', 'LICENSE', 'THIRD_PARTY_NOTICES.md', 'CHANGELOG.md',
    'CONTRIBUTING.md', 'SECURITY.md', 'ACCESSIBILITY.md',
    'scripts/engine/index.html', 'scripts/engine/core.js', 'scripts/engine/lib/rig.js',
    'scripts/engine/lib/fonts/Rubik-900.woff2', 'scripts/engine/lib/fonts/OFL-Rubik.txt',
    'scripts/render.py', 'scripts/spec.py', 'scripts/script2spec.py',
    'references/03-spec-reference.md', 'examples/v2_showcase/spec.json',
}


def git(*args):
    return subprocess.check_output(['git', '-C', str(ROOT), *args])


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--ref', default='HEAD')
    parser.add_argument('--out', type=Path, default=Path('dist'))
    args = parser.parse_args()
    commit = git('rev-parse', '--verify', '--end-of-options', args.ref + '^{commit}').decode().strip()
    files = set(git('ls-tree', '-r', '--name-only', commit).decode().splitlines())
    missing = REQUIRED - files
    if missing:
        raise SystemExit('Commit is missing release files: ' + ', '.join(sorted(missing)))
    args.out.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='toon-explainer-release-') as folder:
        stage = Path(folder)
        git('archive', '--format=zip', '--prefix=toon-explainer/',
            '--output=' + str(stage / 'toon-explainer.zip'), commit)
        tar = stage / 'source.tar'
        git('archive', '--format=tar', '--prefix=toon-explainer/', '--output=' + str(tar), commit)
        with tar.open('rb') as source, (stage / 'toon-explainer.tar.gz').open('wb') as output:
            with gzip.GzipFile(filename='', fileobj=output, mode='wb', mtime=0) as compressed:
                shutil.copyfileobj(source, compressed)
        sums = []
        for name in ['toon-explainer.zip', 'toon-explainer.tar.gz']:
            path = stage / name
            digest = hashlib.sha256(path.read_bytes()).hexdigest()
            sums.append(f'{digest}  {name}\n')
            shutil.copyfile(path, args.out / name)
        (args.out / 'SHA256SUMS').write_text(''.join(sums))
    print(f'Release archives for {commit[:12]} -> {args.out}')


if __name__ == '__main__':
    main()
