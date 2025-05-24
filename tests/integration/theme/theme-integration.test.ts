/**
 * Integration tests for custom theme
 * 
 * This test suite verifies that the custom theme integrates properly
 * with the Docusaurus build process and renders correctly.
 * 
 * @packageDocumentation
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync, rmSync } from 'fs';
import { join } from 'path';

const execAsync = promisify(exec);

describe('Theme Integration', () => {
  const websitePath = join(process.cwd(), 'website');
  const buildPath = join(websitePath, 'build');

  beforeAll(async () => {
    // Clean any existing build
    if (existsSync(buildPath)) {
      rmSync(buildPath, { recursive: true, force: true });
    }
  });

  afterAll(async () => {
    // Clean up build artifacts
    if (existsSync(buildPath)) {
      rmSync(buildPath, { recursive: true, force: true });
    }
  });

  describe('Documentation Build with Custom Theme', () => {
    it('should build documentation site successfully with custom theme', async () => {
      // Build the documentation site
      const { stdout, stderr } = await execAsync('pnpm docs:build', {
        cwd: process.cwd(),
        timeout: 120000
      });

      // Check that build completed successfully
      expect(stderr).not.toContain('Error:');
      expect(stdout).toContain('Success!');

      // Verify build directory exists
      expect(existsSync(buildPath)).toBe(true);
    }, 120000);

    it('should include custom CSS in built site', async () => {
      // Ensure site is built
      if (!existsSync(buildPath)) {
        await execAsync('pnpm docs:build', { cwd: process.cwd(), timeout: 120000 });
      }

      // Check for CSS assets
      const assetsPath = join(buildPath, 'assets');
      expect(existsSync(assetsPath)).toBe(true);

      // Look for CSS files containing our custom variables
      const { stdout } = await execAsync(`find "${assetsPath}" -name "*.css" -exec grep -l "4f46e5" {} \\; | head -1`);
      expect(stdout.trim()).toBeTruthy();
    }, 60000);

    it('should include custom logo in built site', async () => {
      // Ensure site is built
      if (!existsSync(buildPath)) {
        await execAsync('pnpm docs:build', { cwd: process.cwd(), timeout: 120000 });
      }

      // Check for logo file
      const logoPath = join(buildPath, 'img', 'logo.svg');
      expect(existsSync(logoPath)).toBe(true);

      // Verify logo content
      const { stdout } = await execAsync(`grep "Graph nodes" "${logoPath}"`);
      expect(stdout).toContain('Graph nodes');
    }, 60000);

    it('should include custom fonts in built site', async () => {
      // Ensure site is built
      if (!existsSync(buildPath)) {
        await execAsync('pnpm docs:build', { cwd: process.cwd(), timeout: 120000 });
      }

      // Check for font references in CSS
      const { stdout } = await execAsync(`find "${buildPath}" -name "*.css" -exec grep -l "Inter" {} \\; | head -1`);
      expect(stdout.trim()).toBeTruthy();
    }, 60000);

    it('should have proper meta tags for branding', async () => {
      // Ensure site is built
      if (!existsSync(buildPath)) {
        await execAsync('pnpm docs:build', { cwd: process.cwd(), timeout: 120000 });
      }

      // Check main index.html
      const indexPath = join(buildPath, 'index.html');
      expect(existsSync(indexPath)).toBe(true);

      const { stdout } = await execAsync(`grep -o "Apache AGE Graph Database Client" "${indexPath}"`);
      expect(stdout.trim()).toBe('Apache AGE Graph Database Client');
    }, 60000);
  });

  describe('Theme Responsiveness', () => {
    it('should include responsive CSS in build', async () => {
      // Ensure site is built
      if (!existsSync(buildPath)) {
        await execAsync('pnpm docs:build', { cwd: process.cwd(), timeout: 120000 });
      }

      // Check for responsive breakpoints in CSS
      const { stdout } = await execAsync(`find "${buildPath}" -name "*.css" -exec grep -l "max-width.*768px" {} \\; | head -1`);
      expect(stdout.trim()).toBeTruthy();
    }, 60000);

    it('should include accessibility features in build', async () => {
      // Ensure site is built
      if (!existsSync(buildPath)) {
        await execAsync('pnpm docs:build', { cwd: process.cwd(), timeout: 120000 });
      }

      // Check for accessibility CSS
      const { stdout } = await execAsync(`find "${buildPath}" -name "*.css" -exec grep -l "prefers-contrast" {} \\; | head -1`);
      expect(stdout.trim()).toBeTruthy();
    }, 60000);
  });

  describe('Theme Performance', () => {
    it('should not significantly increase bundle size', async () => {
      // Ensure site is built
      if (!existsSync(buildPath)) {
        await execAsync('pnpm docs:build', { cwd: process.cwd(), timeout: 120000 });
      }

      // Check total CSS size (should be reasonable)
      const { stdout } = await execAsync(`find "${buildPath}" -name "*.css" -exec du -c {} + | tail -1`);
      const totalSize = parseInt(stdout.split('\t')[0]);
      
      // CSS should be less than 1MB (1024KB)
      expect(totalSize).toBeLessThan(1024);
    }, 60000);

    it('should compress CSS properly', async () => {
      // Ensure site is built
      if (!existsSync(buildPath)) {
        await execAsync('pnpm docs:build', { cwd: process.cwd(), timeout: 120000 });
      }

      // Check that CSS is minified (no unnecessary whitespace)
      const { stdout } = await execAsync(`find "${buildPath}" -name "*.css" -exec head -1 {} \\; | head -1`);
      
      // Minified CSS should not have excessive whitespace
      expect(stdout.split(' ').length).toBeLessThan(50);
    }, 60000);
  });

  describe('Dark Theme Support', () => {
    it('should include dark theme CSS variables', async () => {
      // Ensure site is built
      if (!existsSync(buildPath)) {
        await execAsync('pnpm docs:build', { cwd: process.cwd(), timeout: 120000 });
      }

      // Check for dark theme CSS
      const { stdout } = await execAsync(`find "${buildPath}" -name "*.css" -exec grep -l "data-theme.*dark" {} \\; | head -1`);
      expect(stdout.trim()).toBeTruthy();
    }, 60000);

    it('should have different colors for dark theme', async () => {
      // Ensure site is built
      if (!existsSync(buildPath)) {
        await execAsync('pnpm docs:build', { cwd: process.cwd(), timeout: 120000 });
      }

      // Check for dark theme primary color
      const { stdout } = await execAsync(`find "${buildPath}" -name "*.css" -exec grep -l "818cf8" {} \\; | head -1`);
      expect(stdout.trim()).toBeTruthy();
    }, 60000);
  });

  describe('SEO and Meta Tags', () => {
    it('should have proper page titles', async () => {
      // Ensure site is built
      if (!existsSync(buildPath)) {
        await execAsync('pnpm docs:build', { cwd: process.cwd(), timeout: 120000 });
      }

      // Check main page title
      const indexPath = join(buildPath, 'index.html');
      const { stdout } = await execAsync(`grep -o "<title>.*</title>" "${indexPath}"`);
      expect(stdout).toContain('ageSchemaClient');
      expect(stdout).toContain('Apache AGE');
    }, 60000);

    it('should have proper meta descriptions', async () => {
      // Ensure site is built
      if (!existsSync(buildPath)) {
        await execAsync('pnpm docs:build', { cwd: process.cwd(), timeout: 120000 });
      }

      // Check meta description
      const indexPath = join(buildPath, 'index.html');
      const { stdout } = await execAsync(`grep -o 'name="description"[^>]*' "${indexPath}"`);
      expect(stdout).toContain('TypeScript library');
      expect(stdout).toContain('Apache AGE');
    }, 60000);
  });

  describe('Asset Optimization', () => {
    it('should optimize SVG logo', async () => {
      // Ensure site is built
      if (!existsSync(buildPath)) {
        await execAsync('pnpm docs:build', { cwd: process.cwd(), timeout: 120000 });
      }

      // Check logo file size (should be reasonable)
      const logoPath = join(buildPath, 'img', 'logo.svg');
      const { stdout } = await execAsync(`du -b "${logoPath}"`);
      const logoSize = parseInt(stdout.split('\t')[0]);
      
      // Logo should be less than 5KB
      expect(logoSize).toBeLessThan(5120);
    }, 60000);

    it('should include proper cache headers setup', async () => {
      // This test verifies the build includes static assets properly
      // In a real deployment, these would have cache headers
      
      // Ensure site is built
      if (!existsSync(buildPath)) {
        await execAsync('pnpm docs:build', { cwd: process.cwd(), timeout: 120000 });
      }

      // Check that assets are in proper directories for caching
      const assetsPath = join(buildPath, 'assets');
      expect(existsSync(assetsPath)).toBe(true);
      
      const imgPath = join(buildPath, 'img');
      expect(existsSync(imgPath)).toBe(true);
    }, 60000);
  });
});
