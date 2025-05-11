/**
 * Integration tests for schema error reporting
 * 
 * These tests verify schema error reporting mechanisms.
 */

import { describe, it, expect } from 'vitest';
import { 
  SchemaDefinition, 
  SchemaParser, 
  SchemaValidator, 
  SchemaValidationError, 
  ValidationErrorCollection,
  PropertyType,
  SchemaParseError
} from '../../../src/schema';
import { loadSchemaFixture } from '../../setup/integration';

describe('Schema Error Reporting Integration', () => {
  it('should report detailed validation errors for vertices', () => {
    // Load the basic schema
    const schema = loadSchemaFixture('basic-schema');
    const validator = new SchemaValidator(schema);
    
    // Invalid person data with multiple issues
    const invalidPersonData = {
      // Missing required name
      email: 'invalid-email', // Invalid email format
      age: 'thirty', // Wrong type
      active: 1, // Wrong type
      unknown: 'unknown property' // Unknown property
    };
    
    // Collect all validation errors
    try {
      validator.validateVertex('Person', invalidPersonData);
      // Should not reach here
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationErrorCollection);
      const validationErrors = (error as ValidationErrorCollection).errors;
      
      // Check for specific errors
      expect(validationErrors.length).toBeGreaterThan(1);
      
      // Check for missing required property error
      const missingNameError = validationErrors.find(e => e.message.includes('name') && e.message.includes('required'));
      expect(missingNameError).toBeDefined();
      
      // Check for wrong type errors
      const ageTypeError = validationErrors.find(e => e.message.includes('age') && e.message.includes('type'));
      expect(ageTypeError).toBeDefined();
      
      const activeTypeError = validationErrors.find(e => e.message.includes('active') && e.message.includes('type'));
      expect(activeTypeError).toBeDefined();
      
      // Check for unknown property error (if allowUnknownProperties is false)
      if (!validator.config.allowUnknownProperties) {
        const unknownPropError = validationErrors.find(e => e.message.includes('unknown'));
        expect(unknownPropError).toBeDefined();
      }
      
      // Check error paths
      for (const error of validationErrors) {
        expect(error.path).toBeDefined();
        expect(error.path).toContain('vertex(Person)');
      }
    }
  });
  
  it('should report detailed validation errors for edges', () => {
    // Load the basic schema
    const schema = loadSchemaFixture('basic-schema');
    const validator = new SchemaValidator(schema);
    
    // Invalid purchase edge data with multiple issues
    const invalidPurchaseData = {
      // Missing required date
      // Missing required quantity
      total: 'not a number', // Wrong type
      unknown: 'unknown property' // Unknown property
    };
    
    // Collect all validation errors
    try {
      validator.validateEdge('PURCHASED', invalidPurchaseData);
      // Should not reach here
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationErrorCollection);
      const validationErrors = (error as ValidationErrorCollection).errors;
      
      // Check for specific errors
      expect(validationErrors.length).toBeGreaterThan(1);
      
      // Check for missing required property errors
      const missingDateError = validationErrors.find(e => e.message.includes('date') && e.message.includes('required'));
      expect(missingDateError).toBeDefined();
      
      const missingQuantityError = validationErrors.find(e => e.message.includes('quantity') && e.message.includes('required'));
      expect(missingQuantityError).toBeDefined();
      
      // Check for wrong type error
      const totalTypeError = validationErrors.find(e => e.message.includes('total') && e.message.includes('type'));
      expect(totalTypeError).toBeDefined();
      
      // Check for unknown property error (if allowUnknownProperties is false)
      if (!validator.config.allowUnknownProperties) {
        const unknownPropError = validationErrors.find(e => e.message.includes('unknown'));
        expect(unknownPropError).toBeDefined();
      }
      
      // Check error paths
      for (const error of validationErrors) {
        expect(error.path).toBeDefined();
        expect(error.path).toContain('edge(PURCHASED)');
      }
    }
  });
  
  it('should report schema parsing errors', () => {
    const parser = new SchemaParser();
    
    // Invalid schema JSON
    const invalidSchemaJson = `{
      "version": "1.0.0",
      "vertices": {
        "Person": {
          "properties": {
            "name": { "type": "string" }
          },
          "required": ["name", "email"] // email property is missing
        }
      },
      "edges": {
        "KNOWS": {
          "properties": {},
          "fromVertex": "Person",
          "toVertex": "NonExistentVertex" // vertex doesn't exist
        }
      }
    }`;
    
    // Parse invalid schema
    try {
      parser.parse(invalidSchemaJson);
      // Should not reach here
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationErrorCollection);
      const validationErrors = (error as ValidationErrorCollection).errors;
      
      // Check for specific errors
      expect(validationErrors.length).toBeGreaterThan(0);
      
      // Check for required property error
      const requiredPropError = validationErrors.find(e => 
        e.message.includes('required') && e.message.includes('email')
      );
      expect(requiredPropError).toBeDefined();
      
      // Check for non-existent vertex error
      const nonExistentVertexError = validationErrors.find(e => 
        e.message.includes('NonExistentVertex')
      );
      expect(nonExistentVertexError).toBeDefined();
    }
  });
  
  it('should report circular dependency errors', () => {
    // Create a schema with circular dependencies
    const circularSchema: SchemaDefinition = {
      version: '1.0.0',
      vertices: {
        A: {
          properties: {
            name: { type: PropertyType.STRING }
          },
          required: ['name'],
          description: 'Vertex A'
        },
        B: {
          properties: {
            name: { type: PropertyType.STRING }
          },
          required: ['name'],
          description: 'Vertex B'
        },
        C: {
          properties: {
            name: { type: PropertyType.STRING }
          },
          required: ['name'],
          description: 'Vertex C'
        }
      },
      edges: {
        A_TO_B: {
          properties: {},
          fromVertex: 'A',
          toVertex: 'B',
          description: 'A to B'
        },
        B_TO_C: {
          properties: {},
          fromVertex: 'B',
          toVertex: 'C',
          description: 'B to C'
        },
        C_TO_A: {
          properties: {},
          fromVertex: 'C',
          toVertex: 'A',
          description: 'C to A (creates a cycle)'
        }
      }
    };
    
    // Validate schema with circular dependency detection
    const parser = new SchemaParser({
      detectCircularDependencies: true
    });
    
    try {
      parser.parseObject(circularSchema);
      // Should not reach here
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationErrorCollection);
      const validationErrors = (error as ValidationErrorCollection).errors;
      
      // Check for circular dependency error
      const circularError = validationErrors.find(e => 
        e.message.includes('circular') || e.message.includes('cycle')
      );
      expect(circularError).toBeDefined();
      expect(circularError!.message).toContain('A');
      expect(circularError!.message).toContain('B');
      expect(circularError!.message).toContain('C');
    }
  });
  
  it('should report detailed errors for complex nested structures', () => {
    // Load the complex schema
    const schema = loadSchemaFixture('complex-schema');
    const validator = new SchemaValidator(schema);
    
    // Invalid user data with nested issues
    const invalidUserData = {
      id: '123',
      username: 'johndoe',
      // Missing required email
      preferences: {
        theme: 123, // Should be a string
        notifications: 'yes' // Should be a boolean
      }
    };
    
    // Collect all validation errors
    try {
      validator.validateVertex('User', invalidUserData);
      // Should not reach here
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationErrorCollection);
      const validationErrors = (error as ValidationErrorCollection).errors;
      
      // Check for specific errors
      expect(validationErrors.length).toBeGreaterThan(1);
      
      // Check for missing required property error
      const missingEmailError = validationErrors.find(e => e.message.includes('email') && e.message.includes('required'));
      expect(missingEmailError).toBeDefined();
      
      // Check for nested property errors
      const themeTypeError = validationErrors.find(e => e.path.includes('preferences.theme'));
      expect(themeTypeError).toBeDefined();
      
      const notificationsTypeError = validationErrors.find(e => e.path.includes('preferences.notifications'));
      expect(notificationsTypeError).toBeDefined();
      
      // Check error paths for nested properties
      for (const error of validationErrors) {
        if (error.path.includes('preferences')) {
          expect(error.path).toContain('vertex(User).preferences');
        }
      }
    }
  });
});
