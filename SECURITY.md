# Security Policy

## Supported Versions

We actively support and patch security issues on the following versions of **ResumeAI Pro**:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please **do not open a public issue**. Instead, report it privately to our security team so we can address it responsibly.

### Steps to Report

1. Send an email to **security@resumeai.pro**.
2. Include a detailed description of the vulnerability, the potential impact, and steps to reproduce (or a proof-of-concept script).
3. We will acknowledge your report within 48 hours and work with you to coordinate a security advisory and patch release.

## Secure Practices in ResumeAI Pro

This project is built with security as a first-class citizen:
- **Database Row-Level Security (RLS)**: PostgreSQL tables enforce `auth.uid() = user_id` checks to prevent multi-tenant data leaks.
- **Content Security Policy (CSP)**: Strict HTTP response headers block cross-site scripting (XSS) and clickjacking.
- **API Key Hashing**: Custom client API keys are hashed using SHA-256 before storage, preventing exposure even in the event of a database dump.
- **Webhook Signature Verification**: Webhook dispatch payloads are signed with a secret HMAC-SHA256 signature to guarantee integrity.
