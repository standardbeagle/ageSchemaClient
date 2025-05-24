/**
 * Tests for custom theme and branding
 * 
 * This test suite verifies that the custom theme is properly configured
 * and that all branding elements are in place.
 * 
 * @packageDocumentation
 */

import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

describe('Custom Theme and Branding', () => {
  const websitePath = join(process.cwd(), 'website');
  
  describe('Custom CSS Theme', () => {
    it('should have custom CSS file with theme variables', () => {
      const customCssPath = join(websitePath, 'src', 'css', 'custom.css');
      expect(existsSync(customCssPath)).toBe(true);
      
      const content = readFileSync(customCssPath, 'utf-8');
      
      // Check for primary color variables
      expect(content).toContain('--ifm-color-primary: #4f46e5');
      expect(content).toContain('--ifm-color-secondary: #06b6d4');
      
      // Check for typography
      expect(content).toContain('Inter');
      expect(content).toContain('JetBrains Mono');
      
      // Check for dark theme variables
      expect(content).toContain('[data-theme=\'dark\']');
      expect(content).toContain('--ifm-color-primary: #818cf8');
    });

    it('should include responsive design breakpoints', () => {
      const customCssPath = join(websitePath, 'src', 'css', 'custom.css');
      const content = readFileSync(customCssPath, 'utf-8');
      
      expect(content).toContain('@media (max-width: 768px)');
      expect(content).toContain('@media (max-width: 480px)');
    });

    it('should include accessibility enhancements', () => {
      const customCssPath = join(websitePath, 'src', 'css', 'custom.css');
      const content = readFileSync(customCssPath, 'utf-8');
      
      expect(content).toContain('@media (prefers-contrast: high)');
      expect(content).toContain('@media (prefers-reduced-motion: reduce)');
      expect(content).toContain('outline: 2px solid');
    });

    it('should include graph-themed decorative elements', () => {
      const customCssPath = join(websitePath, 'src', 'css', 'custom.css');
      const content = readFileSync(customCssPath, 'utf-8');
      
      expect(content).toContain('.graph-decoration');
      expect(content).toContain('border-radius: 50%');
    });

    it('should include enhanced hero section styling', () => {
      const customCssPath = join(websitePath, 'src', 'css', 'custom.css');
      const content = readFileSync(customCssPath, 'utf-8');
      
      expect(content).toContain('.hero');
      expect(content).toContain('linear-gradient');
      expect(content).toContain('.hero__title');
      expect(content).toContain('.hero__subtitle');
    });
  });

  describe('Logo and Branding', () => {
    it('should have custom logo SVG file', () => {
      const logoPath = join(websitePath, 'static', 'img', 'logo.svg');
      expect(existsSync(logoPath)).toBe(true);
      
      const content = readFileSync(logoPath, 'utf-8');
      expect(content).toContain('<svg');
      expect(content).toContain('viewBox="0 0 32 32"');
      expect(content).toContain('Graph nodes');
      expect(content).toContain('Graph edges');
    });

    it('should have logo configured in Docusaurus config', () => {
      const configPath = join(websitePath, 'docusaurus.config.ts');
      expect(existsSync(configPath)).toBe(true);
      
      const content = readFileSync(configPath, 'utf-8');
      expect(content).toContain('logo: {');
      expect(content).toContain('src: \'img/logo.svg\'');
      expect(content).toContain('alt: \'ageSchemaClient Logo\'');
    });

    it('should have Logo component with proper styling', () => {
      const logoComponentPath = join(websitePath, 'src', 'components', 'Logo', 'index.tsx');
      expect(existsSync(logoComponentPath)).toBe(true);
      
      const content = readFileSync(logoComponentPath, 'utf-8');
      expect(content).toContain('export default function Logo');
      expect(content).toContain('Graph nodes');
      expect(content).toContain('Graph edges');
      expect(content).toContain('aria-label="ageSchemaClient Logo"');
    });

    it('should have Logo component styles', () => {
      const logoStylesPath = join(websitePath, 'src', 'components', 'Logo', 'styles.module.css');
      expect(existsSync(logoStylesPath)).toBe(true);
      
      const content = readFileSync(logoStylesPath, 'utf-8');
      expect(content).toContain('.logo');
      expect(content).toContain('.node');
      expect(content).toContain('.edge');
      expect(content).toContain('transition:');
      expect(content).toContain('@keyframes pulse');
    });
  });

  describe('Homepage Branding', () => {
    it('should have updated homepage with ageSchemaClient branding', () => {
      const homepagePath = join(websitePath, 'src', 'pages', 'index.tsx');
      expect(existsSync(homepagePath)).toBe(true);
      
      const content = readFileSync(homepagePath, 'utf-8');
      expect(content).toContain('Apache AGE Graph Database Client');
      expect(content).toContain('Get Started 🚀');
      expect(content).toContain('API Reference 📚');
      expect(content).toContain('TypeScript library for Apache AGE graph databases');
    });

    it('should have updated homepage features', () => {
      const featuresPath = join(websitePath, 'src', 'components', 'HomepageFeatures', 'index.tsx');
      expect(existsSync(featuresPath)).toBe(true);
      
      const content = readFileSync(featuresPath, 'utf-8');
      expect(content).toContain('Type-Safe Graph Operations');
      expect(content).toContain('Apache AGE Integration');
      expect(content).toContain('Powerful Query Builder');
      expect(content).toContain('TypeScript for complete type safety');
      expect(content).toContain('PostgreSQL extension');
      expect(content).toContain('Cypher queries');
    });
  });

  describe('Color Scheme Validation', () => {
    it('should use graph database inspired colors', () => {
      const customCssPath = join(websitePath, 'src', 'css', 'custom.css');
      const content = readFileSync(customCssPath, 'utf-8');
      
      // Primary indigo color (represents connections and networks)
      expect(content).toContain('#4f46e5');
      
      // Secondary cyan color (represents data flow)
      expect(content).toContain('#06b6d4');
      
      // Success emerald color
      expect(content).toContain('#10b981');
      
      // Warning amber color
      expect(content).toContain('#f59e0b');
      
      // Danger red color
      expect(content).toContain('#ef4444');
    });

    it('should have proper contrast ratios for accessibility', () => {
      const customCssPath = join(websitePath, 'src', 'css', 'custom.css');
      const content = readFileSync(customCssPath, 'utf-8');
      
      // Should have high contrast mode support
      expect(content).toContain('@media (prefers-contrast: high)');
      
      // Should have different colors for dark theme
      expect(content).toContain('[data-theme=\'dark\']');
      expect(content).toContain('--ifm-color-primary: #818cf8');
    });
  });

  describe('Typography and Fonts', () => {
    it('should use modern font stack', () => {
      const customCssPath = join(websitePath, 'src', 'css', 'custom.css');
      const content = readFileSync(customCssPath, 'utf-8');
      
      expect(content).toContain('Inter');
      expect(content).toContain('JetBrains Mono');
      expect(content).toContain('--ifm-font-family-base');
      expect(content).toContain('--ifm-font-family-monospace');
    });

    it('should have proper font weights defined', () => {
      const customCssPath = join(websitePath, 'src', 'css', 'custom.css');
      const content = readFileSync(customCssPath, 'utf-8');
      
      expect(content).toContain('--ifm-font-weight-light: 300');
      expect(content).toContain('--ifm-font-weight-normal: 400');
      expect(content).toContain('--ifm-font-weight-semibold: 500');
      expect(content).toContain('--ifm-font-weight-bold: 600');
    });
  });

  describe('Component Enhancements', () => {
    it('should have enhanced button styles', () => {
      const customCssPath = join(websitePath, 'src', 'css', 'custom.css');
      const content = readFileSync(customCssPath, 'utf-8');
      
      expect(content).toContain('.button');
      expect(content).toContain('transform: translateY(-1px)');
      expect(content).toContain('box-shadow:');
      expect(content).toContain('backdrop-filter: blur');
    });

    it('should have enhanced code block styles', () => {
      const customCssPath = join(websitePath, 'src', 'css', 'custom.css');
      const content = readFileSync(customCssPath, 'utf-8');
      
      expect(content).toContain('.prism-code');
      expect(content).toContain('code {');
      expect(content).toContain('--ifm-code-background');
    });

    it('should have enhanced navigation styles', () => {
      const customCssPath = join(websitePath, 'src', 'css', 'custom.css');
      const content = readFileSync(customCssPath, 'utf-8');
      
      expect(content).toContain('.navbar');
      expect(content).toContain('.menu__link');
      expect(content).toContain('backdrop-filter: blur');
    });
  });
});
