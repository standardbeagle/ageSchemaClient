/**
 * Tests for API documentation generation
 *
 * This test suite verifies that the TypeDoc API documentation generation
 * works correctly and produces the expected output structure.
 *
 * @packageDocumentation
 */

import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

describe('API Documentation Generation', () => {
  const docsPath = join(process.cwd(), 'website', 'docs', 'api-generated');

  describe('Generated Documentation Structure', () => {
    it('should have generated the main API index file', () => {
      const indexPath = join(docsPath, 'index.md');
      expect(existsSync(indexPath)).toBe(true);

      const content = readFileSync(indexPath, 'utf-8');
      expect(content).toContain('age-schema-client v0.3.0');
      expect(content).toContain('ageSchemaClient - A TypeScript library for Apache AGE graph databases');
    });

    it('should have generated class documentation', () => {
      const classesPath = join(docsPath, 'classes');
      expect(existsSync(classesPath)).toBe(true);

      // Check for key classes
      const keyClasses = [
        'QueryBuilder.md',
        'SchemaLoader.md',
        'BatchOperations.md',
        'TransactionManager.md',
        'PgConnectionManager.md'
      ];

      keyClasses.forEach(className => {
        const classPath = join(classesPath, className);
        expect(existsSync(classPath)).toBe(true);
      });
    });

    it('should have generated interface documentation', () => {
      const interfacesPath = join(docsPath, 'interfaces');
      expect(existsSync(interfacesPath)).toBe(true);

      // Check for key interfaces
      const keyInterfaces = [
        'ClientConfig.md',
        'SchemaDefinition.md',
        'QueryResult.md',
        'Connection.md'
      ];

      keyInterfaces.forEach(interfaceName => {
        const interfacePath = join(interfacesPath, interfaceName);
        expect(existsSync(interfacePath)).toBe(true);
      });
    });

    it('should have generated function documentation', () => {
      const functionsPath = join(docsPath, 'functions');
      expect(existsSync(functionsPath)).toBe(true);

      // Check for key functions
      const keyFunctions = [
        'isSchemaDefinition.md',
        'compareSchemas.md',
        'migrateSchema.md'
      ];

      keyFunctions.forEach(functionName => {
        const functionPath = join(functionsPath, functionName);
        expect(existsSync(functionPath)).toBe(true);
      });
    });

    it('should have generated type alias documentation', () => {
      const typeAliasesPath = join(docsPath, 'type-aliases');
      expect(existsSync(typeAliasesPath)).toBe(true);

      // Check for key type aliases
      const keyTypeAliases = [
        'QueryBuilderResult.md',
        'VertexProperties.md',
        'EdgeProperties.md'
      ];

      keyTypeAliases.forEach(typeName => {
        const typePath = join(typeAliasesPath, typeName);
        expect(existsSync(typePath)).toBe(true);
      });
    });

    it('should have generated enumeration documentation', () => {
      const enumerationsPath = join(docsPath, 'enumerations');
      expect(existsSync(enumerationsPath)).toBe(true);

      // Check for key enumerations
      const keyEnums = [
        'ErrorCode.md',
        'PropertyType.md',
        'OrderDirection.md'
      ];

      keyEnums.forEach(enumName => {
        const enumPath = join(enumerationsPath, enumName);
        expect(existsSync(enumPath)).toBe(true);
      });
    });
  });

  describe('Documentation Content Quality', () => {
    it('should include proper JSDoc comments in AgeSchemaClient documentation', () => {
      const clientPath = join(docsPath, 'classes', 'AgeSchemaClient.md');
      if (existsSync(clientPath)) {
        const content = readFileSync(clientPath, 'utf-8');
        expect(content).toContain('Main client class for interacting with Apache AGE graph databases');
        expect(content).toContain('Constructor');
        expect(content).toContain('getConfig');
      }
    });

    it('should include proper JSDoc comments in QueryBuilder documentation', () => {
      const builderPath = join(docsPath, 'classes', 'QueryBuilder.md');
      if (existsSync(builderPath)) {
        const content = readFileSync(builderPath, 'utf-8');
        expect(content).toContain('Query builder class');
        expect(content).toContain('match');
        expect(content).toContain('where');
        expect(content).toContain('execute');
      }
    });

    it('should include source links to GitHub', () => {
      const clientPath = join(docsPath, 'classes', 'AgeSchemaClient.md');
      if (existsSync(clientPath)) {
        const content = readFileSync(clientPath, 'utf-8');
        // The generated docs should include links to the source code
        expect(content).toContain('github.com/standardbeagle/ageSchemaClient');
      }
    });

    it('should include proper parameter and return type documentation', () => {
      const builderPath = join(docsPath, 'classes', 'QueryBuilder.md');
      if (existsSync(builderPath)) {
        const content = readFileSync(builderPath, 'utf-8');
        // Should include parameter documentation
        expect(content).toMatch(/param|parameter|@param/i);
        // Should include return type documentation
        expect(content).toMatch(/returns?|@returns?/i);
      }
    });
  });

  describe('Integration with Docusaurus', () => {
    it('should be properly configured in Docusaurus config', () => {
      const configPath = join(process.cwd(), 'website', 'docusaurus.config.ts');
      expect(existsSync(configPath)).toBe(true);

      const content = readFileSync(configPath, 'utf-8');
      expect(content).toContain('docusaurus-plugin-typedoc');
      expect(content).toContain('api-generated');
    });

    it('should be linked from the main API reference', () => {
      const apiRefPath = join(process.cwd(), 'website', 'docs', 'api-reference', 'index.md');
      expect(existsSync(apiRefPath)).toBe(true);

      const content = readFileSync(apiRefPath, 'utf-8');
      expect(content).toContain('Complete API Reference');
      expect(content).toContain('./api-generated/');
    });
  });
});
