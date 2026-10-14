# Security policy

toon-explainer is a local animation toolkit that runs Python scripts, JavaScript drawing code, Chromium and FFmpeg. Its intended workflow uses specs, code and assets that you have reviewed and trust.

## Supported code

Security fixes target the current `main` branch. Older releases, copied engine directories and modified forks should be updated or have relevant fixes applied separately; this project does not define a maintenance schedule for historical versions.

## Report a vulnerability

Use the repository's [Security page](https://github.com/Hostlife22/toon-explainer/security). If **Report a vulnerability** is available, submit a private report there. The feature must be enabled in GitHub; adding this policy does not enable it. See [GitHub's private-reporting instructions](https://docs.github.com/en/code-security/how-tos/report-and-fix-vulnerabilities/report-privately).

If private reporting is unavailable, open an [issue](https://github.com/Hostlife22/toon-explainer/issues) titled **Private security contact request** and ask for a private reporting channel. Include no vulnerability details in that public request. Do not publish exploit code, credentials or sensitive files in an issue or pull request.

In the private report, include:

- The affected commit, script or spec and your operating system.
- The expected behavior, actual behavior and security impact.
- Minimal reproduction steps using non-sensitive sample data.
- Any proposed fix or workaround, if you have one.

Coordinate publication of technical details with the maintainers while a fix is reviewed. There is no guaranteed response or resolution deadline.

## Running the toolkit

- Review third-party specs, engine code and dependencies before execution. Rendering executes the engine's JavaScript in Chromium; Python tools execute with your local account's permissions.
- `render.py` binds its server to `127.0.0.1` on a random port (or `--port` with `--serve`). It serves the engine directory and only the exact image files referenced by the spec. The servers are development tools with no authentication.
- The renderer relaxes Chromium's web-security checks for local asset handling. Treat it as a local tool for trusted projects, rather than a service for untrusted uploads.
- Review spec image paths. A spec can reference local files or remote images; remote resources make network requests.
- Keep Python, Chromium, FFmpeg and their dependencies updated. Keep secrets and private source media outside directories referenced by specs.

## Scope

Reports about unexpected file access, unintended command execution, script injection, exposed secrets or dependency vulnerabilities are relevant. Running deliberately malicious engine code is outside the intended trust model, but bypasses of spec validation or file-serving boundaries should still be reported.

Ordinary rendering bugs, animation timing and visual-accessibility issues can be reported through public issues. See [CONTRIBUTING.md](CONTRIBUTING.md) and [ACCESSIBILITY.md](ACCESSIBILITY.md).
