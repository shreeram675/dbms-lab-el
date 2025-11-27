# Security & Compliance

## 1. WAF Rules (OWASP)
- **SQL Injection**: Block requests containing SQL keywords.
- **XSS**: Block requests with `<script>` tags.
- **Rate Limiting**: 100 requests/min per IP.

## 2. GDPR
- **Right to be Forgotten**:
    1. Delete user record from DB.
    2. Delete files from S3.
    3. **Note**: Blockchain hashes CANNOT be deleted. This must be disclosed in Terms of Service.

## 3. Vulnerability Scanning
- **Trivy**: Runs in CI pipeline to scan Docker images.
- **Snyk**: Scans Node.js dependencies.
