# Security Workflow

1. **Dependency Audit**
   - Run `npm audit --json > security/audit.json`
   - Run `osv-scanner --lockfile=package-lock.json --json > security/osv.json`
2. **CSP Verification**
   - Run `ts-node scripts/verify-csp.ts apps/authoring-ui/index.html`
3. **SRI Check**
   - Check all CDN <script> tags for integrity attribute
4. **Plugin Capability Fuzzing**
   - Use custom fuzzer to test plugin-host sandbox
5. **OWASP ZAP Scan**
   - Run ZAP CLI against dev server: `zap-cli quick-scan http://localhost:3000`
6. **Report**
   - Summarize findings in SECURITY_REPORT.md
