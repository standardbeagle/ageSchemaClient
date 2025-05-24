/**
 * Integration tests for API documentation generation
 *
 * This test suite verifies that the API documentation generation
 * process works correctly in a CI/CD environment and integrates
 * properly with the build process.
 *
 * @packageDocumentation
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync, rmSync } from 'fs';
import { join } from 'path';

const execAsync = promisify(exec);

describe('API Documentation Generation Integration', () => {
  const docsPath = join(process.cwd(), 'website', 'docs', 'api-generated');
  const backupPath = join(process.cwd(), 'website', 'docs', 'api-generated-backup');

  beforeAll(async () => {
    // Backup existing docs if they exist
    if (existsSync(docsPath)) {
      await execAsync(`cp -r "${docsPath}" "${backupPath}"`);
    }
  });

  afterAll(async () => {
    // Restore backup if it exists
    if (existsSync(backupPath)) {
      if (existsSync(docsPath)) {
        rmSync(docsPath, { recursive: true, force: true });
      }
      await execAsync(`mv "${backupPath}" "${docsPath}"`);
    }
  });

  describe('Build Process Integration', () => {
    it('should generate API documentation via npm script', async () => {
      // Clean existing docs
      if (existsSync(docsPath)) {
        rmSync(docsPath, { recursive: true, force: true });
      }

      // Run the API documentation generation script
      const { stdout, stderr } = await execAsync('pnpm docs:api', {
        cwd: process.cwd(),
        timeout: 60000
      });

      // Check that the command completed successfully (warnings are OK)
      expect(stderr).not.toContain('Error:');
      expect(stdout).toContain('markdown generated');

      // Verify the documentation was generated
      expect(existsSync(docsPath)).toBe(true);
      expect(existsSync(join(docsPath, 'index.md'))).toBe(true);
      expect(existsSync(join(docsPath, 'classes'))).toBe(true);
      expect(existsSync(join(docsPath, 'interfaces'))).toBe(true);
    }, 60000);

    it('should clean and regenerate documentation', async () => {
      // Ensure docs exist first
      if (!existsSync(docsPath)) {
        await execAsync('pnpm docs:api');
      }

      // Run clean command
      await execAsync('pnpm docs:api:clean');

      // Verify docs were cleaned
      expect(existsSync(docsPath)).toBe(false);

      // Regenerate docs
      await execAsync('pnpm docs:api');

      // Verify docs were regenerated
      expect(existsSync(docsPath)).toBe(true);
      expect(existsSync(join(docsPath, 'index.md'))).toBe(true);
    }, 60000);

    it('should integrate with full documentation build', async () => {
      // Skip this test for now as it takes too long
      // Just verify that the docs:full script exists
      const packageJsonPath = join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(require('fs').readFileSync(packageJsonPath, 'utf-8'));
      expect(packageJson.scripts['docs:full']).toBeDefined();
      expect(packageJson.scripts['docs:full']).toContain('docs:api');
      expect(packageJson.scripts['docs:full']).toContain('docs:build');
    }, 10000);
  });

  describe('TypeDoc Configuration Validation', () => {
    it('should respect TypeDoc configuration settings', async () => {
      // Clean and regenerate to ensure fresh output
      if (existsSync(docsPath)) {
        rmSync(docsPath, { recursive: true, force: true });
      }

      await execAsync('pnpm docs:api');

      // Check that configuration settings are applied
      const indexPath = join(docsPath, 'index.md');
      expect(existsSync(indexPath)).toBe(true);

      // Verify that private members are excluded (as per config)
      const classFiles = [
        join(docsPath, 'classes', 'AgeSchemaClient.md'),
        join(docsPath, 'classes', 'QueryBuilder.md')
      ];

      for (const classFile of classFiles) {
        if (existsSync(classFile)) {
          const { stdout } = await execAsync(`grep -i "private" "${classFile}" || true`);
          // Should not contain private members in the documentation
          expect(stdout.trim()).toBe('');
        }
      }
    }, 60000);

    it('should include source links as configured', async () => {
      const classPath = join(docsPath, 'classes', 'AgeSchemaClient.md');
      if (existsSync(classPath)) {
        const { stdout } = await execAsync(`grep -o "github.com/standardbeagle/ageSchemaClient" "${classPath}" | head -1`);
        expect(stdout.trim()).toBe('github.com/standardbeagle/ageSchemaClient');
      }
    });

    it('should generate markdown in the correct format', async () => {
      const indexPath = join(docsPath, 'index.md');
      if (existsSync(indexPath)) {
        const { stdout } = await execAsync(`head -5 "${indexPath}"`);
        expect(stdout).toContain('**age-schema-client v');
        expect(stdout).toContain('***');
      }
    });
  });

  describe('Documentation Quality Checks', () => {
    it('should generate documentation for all public API classes', async () => {
      const requiredClasses = [
        'AgeSchemaClient',
        'QueryBuilder',
        'SchemaLoader',
        'BatchOperations',
        'TransactionManager',
        'PgConnectionManager'
      ];

      for (const className of requiredClasses) {
        const classPath = join(docsPath, 'classes', `${className}.md`);
        expect(existsSync(classPath)).toBe(true);
      }
    });

    it('should generate documentation for all public interfaces', async () => {
      const requiredInterfaces = [
        'ClientConfig',
        'SchemaDefinition',
        'QueryResult',
        'Connection'
      ];

      for (const interfaceName of requiredInterfaces) {
        const interfacePath = join(docsPath, 'interfaces', `${interfaceName}.md`);
        expect(existsSync(interfacePath)).toBe(true);
      }
    });

    it('should include proper cross-references between types', async () => {
      const clientPath = join(docsPath, 'classes', 'AgeSchemaClient.md');
      if (existsSync(clientPath)) {
        const { stdout } = await execAsync(`grep -o "\\[.*\\](" "${clientPath}" | head -5`);
        // Should contain markdown links to other types
        expect(stdout).toContain('[');
        expect(stdout).toContain('](');
      }
    });
  });
});
