"""Exercise release packaging in temporary Git repositories without publishing."""
import hashlib
import importlib.util
import shutil
import subprocess
import sys
import tarfile
import tempfile
import unittest
import zipfile
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / 'scripts/build_release.py'
SPEC = importlib.util.spec_from_file_location('build_release', SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class ReleaseTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='toon-explainer-release-test-')
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.git('init', '--quiet')
        for name in MODULE.REQUIRED:
            path = self.root / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(f'Committed fixture: {name}\n'.encode())
        self.script = self.root / 'scripts/build_release.py'
        shutil.copyfile(SCRIPT, self.script)
        self.git('add', '.')
        self.git('-c', 'user.name=Release Test', '-c', 'user.email=release-test@example.invalid',
                 'commit', '--quiet', '-m', 'Fixture')
        self.git('tag', 'v1.0.0')

    def git(self, *args):
        return subprocess.check_output(['git', '-C', str(self.root), *args], stderr=subprocess.PIPE)

    def build(self, ref='v1.0.0', out='dist'):
        return subprocess.run([sys.executable, str(self.script), '--ref', ref, '--out', out],
                              cwd=self.root, text=True, capture_output=True)

    def test_archives_use_tagged_files_and_have_valid_checksums(self):
        original = (self.root / 'README.md').read_bytes()
        (self.root / 'README.md').write_text('Uncommitted change')
        (self.root / '.env').write_text('UNTRACKED_FIXTURE=1')
        result = self.build()
        self.assertEqual(result.returncode, 0, result.stderr)
        out = self.root / 'dist'
        with zipfile.ZipFile(out / 'toon-explainer.zip') as archive:
            zip_files = {name for name in archive.namelist() if not name.endswith('/')}
            self.assertEqual(archive.read('toon-explainer/README.md'), original)
            self.assertNotIn('toon-explainer/.env', zip_files)
            self.assertTrue({f'toon-explainer/{name}' for name in MODULE.REQUIRED} <= zip_files)
        with tarfile.open(out / 'toon-explainer.tar.gz') as archive:
            tar_files = {member.name for member in archive if member.isfile()}
            self.assertEqual(tar_files, zip_files)
            self.assertEqual(archive.extractfile('toon-explainer/README.md').read(), original)
        sums = (out / 'SHA256SUMS').read_text().splitlines()
        self.assertEqual(len(sums), 2)
        for line in sums:
            digest, name = line.split('  ')
            self.assertEqual(hashlib.sha256((out / name).read_bytes()).hexdigest(), digest)

    def test_same_commit_produces_identical_archives(self):
        for folder in ['first', 'second']:
            result = self.build(out=folder)
            self.assertEqual(result.returncode, 0, result.stderr)
        for name in ['toon-explainer.zip', 'toon-explainer.tar.gz', 'SHA256SUMS']:
            self.assertEqual((self.root / 'first' / name).read_bytes(),
                             (self.root / 'second' / name).read_bytes())

    def test_incomplete_commit_and_unknown_ref_do_not_create_assets(self):
        self.git('rm', 'LICENSE')
        self.git('-c', 'user.name=Release Test', '-c', 'user.email=release-test@example.invalid',
                 'commit', '--quiet', '-m', 'Incomplete fixture')
        for ref in ['HEAD', 'missing-tag']:
            result = self.build(ref=ref)
            self.assertNotEqual(result.returncode, 0)
            self.assertFalse((self.root / 'dist').exists())


if __name__ == '__main__':
    unittest.main()
