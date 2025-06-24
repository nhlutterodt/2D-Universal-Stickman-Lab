/**
 * Enhanced CSP verification and security validation tool.
 * Features:
 * - Comprehensive CSP validation
 * - Inline script/style detection
 * - Security header recommendations
 * - Automated fixing capabilities
 * - Multiple file support
 */

import * as fs from 'fs';
import * as path from 'path';
import { JSDOM } from 'jsdom';

interface CSPOptions {
  fix?: boolean;
  strict?: boolean;
  files?: string[];
  recursive?: boolean;
}

interface SecurityIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
  file?: string;
  line?: number;
  fixable?: boolean;
}

class CSPValidator {
  private issues: SecurityIssue[] = [];

  private addIssue(issue: SecurityIssue): void {
    this.issues.push(issue);
  }

  private validateCSPDirectives(csp: string, file: string): void {
    const directives = csp.split(';').map(d => d.trim());
    const directiveMap = new Map<string, string>();

    // Parse directives
    for (const directive of directives) {
      const [name, ...values] = directive.split(/\s+/);
      if (name) {
        directiveMap.set(name, values.join(' '));
      }
    }

    // Required directives
    const required = [
      'default-src',
      'script-src',
      'style-src',
      'object-src'
    ];

    for (const req of required) {
      if (!directiveMap.has(req)) {
        this.addIssue({
          type: 'error',
          message: `Missing required CSP directive: ${req}`,
          file,
          fixable: true
        });
      }
    }

    // Validate script-src
    const scriptSrc = directiveMap.get('script-src');
    if (scriptSrc) {
      if (scriptSrc.includes("'unsafe-inline'")) {
        this.addIssue({
          type: 'error',
          message: "script-src contains 'unsafe-inline' which defeats CSP protection",
          file,
          fixable: true
        });
      }
      
      if (scriptSrc.includes("'unsafe-eval'")) {
        this.addIssue({
          type: 'warning',
          message: "script-src contains 'unsafe-eval' which may be risky",
          file
        });
      }
      
      if (!scriptSrc.includes("'self'")) {
        this.addIssue({
          type: 'warning',
          message: "script-src should include 'self' for local scripts",
          file,
          fixable: true
        });
      }
    }

    // Validate style-src
    const styleSrc = directiveMap.get('style-src');
    if (styleSrc && styleSrc.includes("'unsafe-inline'")) {
      this.addIssue({
        type: 'warning',
        message: "style-src contains 'unsafe-inline' which reduces security",
        file
      });
    }

    // Check for object-src 'none'
    const objectSrc = directiveMap.get('object-src');
    if (objectSrc !== "'none'") {
      this.addIssue({
        type: 'warning',
        message: "object-src should be set to 'none' for better security",
        file,
        fixable: true
      });
    }
  }

  private detectInlineScripts(html: string, file: string): void {
    // Remove external scripts from consideration
    const htmlWithoutExternal = html.replace(/<script[^>]*src=[^>]*><\/script>/gi, '');
    
    // Check for inline scripts
    const inlineScriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
    let match;
    let lineNumber = 1;
    
    while ((match = inlineScriptRegex.exec(htmlWithoutExternal)) !== null) {
      const content = match[1].trim();
      if (content.length > 0) {
        // Count line numbers up to this point
        const beforeMatch = htmlWithoutExternal.substring(0, match.index);
        lineNumber = (beforeMatch.match(/\n/g) || []).length + 1;
        
        this.addIssue({
          type: 'error',
          message: 'Inline script detected - violates CSP',
          file,
          line: lineNumber,
          fixable: false
        });
      }
    }
  }

  private detectInlineStyles(html: string, file: string): void {
    // Check for inline styles in style tags
    const inlineStyleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
    let match;
    
    while ((match = inlineStyleRegex.exec(html)) !== null) {
      const content = match[1].trim();
      if (content.length > 0) {
        const beforeMatch = html.substring(0, match.index);
        const lineNumber = (beforeMatch.match(/\n/g) || []).length + 1;
        
        this.addIssue({
          type: 'warning',
          message: 'Inline style detected - may violate CSP',
          file,
          line: lineNumber
        });
      }
    }

    // Check for style attributes
    const styleAttrRegex = /\sstyle\s*=\s*["'][^"']*["']/gi;
    while ((match = styleAttrRegex.exec(html)) !== null) {
      const beforeMatch = html.substring(0, match.index);
      const lineNumber = (beforeMatch.match(/\n/g) || []).length + 1;
      
      this.addIssue({
        type: 'info',
        message: 'Inline style attribute detected',
        file,
        line: lineNumber
      });
    }
  }

  private checkSecurityHeaders(html: string, file: string): void {
    const dom = new JSDOM(html);
    const document = dom.window.document;
    
    // Check for other security headers
    const securityHeaders = [
      'X-Content-Type-Options',
      'X-Frame-Options',
      'X-XSS-Protection',
      'Referrer-Policy'
    ];

    for (const header of securityHeaders) {
      const meta = document.querySelector(`meta[http-equiv="${header}"]`);
      if (!meta) {
        this.addIssue({
          type: 'info',
          message: `Consider adding ${header} meta tag for enhanced security`,
          file,
          fixable: true
        });
      }
    }
  }

  private generateFixedCSP(): string {
    return `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';`;
  }

  private fixHTMLFile(filePath: string): void {
    const html = fs.readFileSync(filePath, 'utf8');
    const dom = new JSDOM(html);
    const document = dom.window.document;
    
    // Fix or add CSP meta tag
    let cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (!cspMeta) {
      cspMeta = document.createElement('meta');
      cspMeta.setAttribute('http-equiv', 'Content-Security-Policy');
      document.head.appendChild(cspMeta);
    }
    cspMeta.setAttribute('content', this.generateFixedCSP());

    // Add other security headers
    const securityHeaders = [
      { name: 'X-Content-Type-Options', content: 'nosniff' },
      { name: 'X-Frame-Options', content: 'DENY' },
      { name: 'X-XSS-Protection', content: '1; mode=block' },
      { name: 'Referrer-Policy', content: 'strict-origin-when-cross-origin' }
    ];

    for (const header of securityHeaders) {
      let meta = document.querySelector(`meta[http-equiv="${header.name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('http-equiv', header.name);
        meta.setAttribute('content', header.content);
        document.head.appendChild(meta);
      }
    }

    // Write fixed HTML
    const fixedHtml = dom.serialize();
    fs.writeFileSync(filePath, fixedHtml);
    console.log(`✅ Fixed security issues in ${filePath}`);
  }

  private findHTMLFiles(dir: string, recursive: boolean = false): string[] {
    const files: string[] = [];
    
    if (!fs.existsSync(dir)) return files;
    
    const entries = fs.readdirSync(dir);
    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && recursive) {
        files.push(...this.findHTMLFiles(fullPath, recursive));
      } else if (stat.isFile() && entry.endsWith('.html')) {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  public validateFile(filePath: string, options: CSPOptions = {}): void {
    if (!fs.existsSync(filePath)) {
      this.addIssue({
        type: 'error',
        message: `File not found: ${filePath}`,
        file: filePath
      });
      return;
    }

    const html = fs.readFileSync(filePath, 'utf8');
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Check for CSP meta tag
    const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (!cspMeta) {
      this.addIssue({
        type: 'error',
        message: 'No CSP meta tag found',
        file: filePath,
        fixable: true
      });
    } else {
      const csp = cspMeta.getAttribute('content') || '';
      this.validateCSPDirectives(csp, filePath);
    }

    // Detect security issues
    this.detectInlineScripts(html, filePath);
    this.detectInlineStyles(html, filePath);
    this.checkSecurityHeaders(html, filePath);

    // Apply fixes if requested
    if (options.fix) {
      const fixableIssues = this.issues.filter(i => i.fixable && i.file === filePath);
      if (fixableIssues.length > 0) {
        this.fixHTMLFile(filePath);
      }
    }
  }

  public validate(options: CSPOptions): void {
    let files: string[] = [];

    if (options.files && options.files.length > 0) {
      for (const file of options.files) {
        if (fs.statSync(file).isDirectory()) {
          files.push(...this.findHTMLFiles(file, options.recursive));
        } else {
          files.push(file);
        }
      }
    } else {
      // Default to finding HTML files in common locations
      const commonDirs = ['apps', 'packages', 'dist', 'build'];
      for (const dir of commonDirs) {
        files.push(...this.findHTMLFiles(dir, true));
      }
    }

    if (files.length === 0) {
      console.log('No HTML files found to validate');
      return;
    }

    console.log(`Validating ${files.length} HTML file(s)...`);
    
    for (const file of files) {
      this.validateFile(file, options);
    }

    this.printReport();
  }

  private printReport(): void {
    const errors = this.issues.filter(i => i.type === 'error');
    const warnings = this.issues.filter(i => i.type === 'warning');
    const infos = this.issues.filter(i => i.type === 'info');

    console.log('\n' + '='.repeat(50));
    console.log('CSP VALIDATION REPORT');
    console.log('='.repeat(50));

    if (errors.length > 0) {
      console.log(`\n🔴 Errors (${errors.length}):`);
      for (const issue of errors) {
        const location = issue.line ? `:${issue.line}` : '';
        console.log(`  ${issue.file}${location}: ${issue.message}`);
      }
    }

    if (warnings.length > 0) {
      console.log(`\n🟡 Warnings (${warnings.length}):`);
      for (const issue of warnings) {
        const location = issue.line ? `:${issue.line}` : '';
        console.log(`  ${issue.file}${location}: ${issue.message}`);
      }
    }

    if (infos.length > 0) {
      console.log(`\n🔵 Info (${infos.length}):`);
      for (const issue of infos) {
        const location = issue.line ? `:${issue.line}` : '';
        console.log(`  ${issue.file}${location}: ${issue.message}`);
      }
    }

    if (this.issues.length === 0) {
      console.log('\n✅ All security checks passed!');
    } else {
      console.log(`\nTotal issues: ${this.issues.length}`);
      const fixable = this.issues.filter(i => i.fixable).length;
      if (fixable > 0) {
        console.log(`Fixable issues: ${fixable} (run with --fix to auto-fix)`);
      }
    }

    console.log('='.repeat(50));

    // Exit with error code if there are errors
    if (errors.length > 0) {
      process.exit(1);
    }
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const options: CSPOptions = {
  files: []
};

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--fix':
      options.fix = true;
      break;
    case '--strict':
      options.strict = true;
      break;
    case '--recursive':
    case '-r':
      options.recursive = true;
      break;
    case '--help':
      console.log(`
Usage: npx ts-node scripts/verify-csp.ts [options] [files...]

Options:
  --fix         Automatically fix CSP issues where possible
  --strict      Use strict CSP validation rules
  -r, --recursive  Recursively search directories for HTML files
  --help        Show this help message

Examples:
  npx ts-node scripts/verify-csp.ts apps/authoring-ui/index.html
  npx ts-node scripts/verify-csp.ts --fix --recursive apps/
  npx ts-node scripts/verify-csp.ts dist/
`);
      process.exit(0);
    default:
      if (!args[i].startsWith('--')) {
        options.files!.push(args[i]);
      }
  }
}

// Run CSP validation
const validator = new CSPValidator();
validator.validate(options);
