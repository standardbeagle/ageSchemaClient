/**
 * Integration tests for schema validation
 * 
 * These tests verify schema validation against real data.
 */

import { describe, it, expect } from 'vitest';
import { SchemaValidator, SchemaValidationError, ValidationErrorCollection } from '../../../src/schema';
import { loadSchemaFixture, getSchemaValidator, createTestVertex } from '../../setup/integration';

describe('Schema Validation Integration', () => {
  it('should validate a valid vertex against the schema', async () => {
    // Load the basic schema
    const schema = loadSchemaFixture('basic-schema');
    const validator = new SchemaValidator(schema);
    
    // Valid person data
    const personData = {
      name: 'John Doe',
      email: 'john@example.com',
      age: 30,
      active: true
    };
    
    // Validate the data
    expect(() => validator.validateVertex('Person', personData)).not.toThrow();
    
    // Create the vertex in the database
    const vertex = await createTestVertex('Person', personData);
    expect(vertex).toBeDefined();
  });
  
  it('should reject an invalid vertex missing required properties', () => {
    // Load the basic schema
    const schema = loadSchemaFixture('basic-schema');
    const validator = new SchemaValidator(schema);
    
    // Invalid person data (missing required email)
    const invalidPersonData = {
      name: 'John Doe',
      age: 30
    };
    
    // Validate the data
    expect(() => validator.validateVertex('Person', invalidPersonData)).toThrow(ValidationErrorCollection);
    
    try {
      validator.validateVertex('Person', invalidPersonData);
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationErrorCollection);
      expect(error.errors).toHaveLength(1);
      expect(error.errors[0]).toBeInstanceOf(SchemaValidationError);
      expect(error.errors[0].message).toContain('email');
    }
  });
  
  it('should reject an invalid vertex with wrong property types', () => {
    // Load the basic schema
    const schema = loadSchemaFixture('basic-schema');
    const validator = new SchemaValidator(schema);
    
    // Invalid person data (wrong type for age)
    const invalidPersonData = {
      name: 'John Doe',
      email: 'john@example.com',
      age: 'thirty' // Should be a number
    };
    
    // Validate the data
    expect(() => validator.validateVertex('Person', invalidPersonData)).toThrow(ValidationErrorCollection);
    
    try {
      validator.validateVertex('Person', invalidPersonData);
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationErrorCollection);
      expect(error.errors).toHaveLength(1);
      expect(error.errors[0]).toBeInstanceOf(SchemaValidationError);
      expect(error.errors[0].message).toContain('age');
      expect(error.errors[0].message).toContain('type');
    }
  });
  
  it('should reject an unknown vertex label', () => {
    // Load the basic schema
    const schema = loadSchemaFixture('basic-schema');
    const validator = new SchemaValidator(schema);
    
    // Data for an unknown vertex label
    const unknownData = {
      name: 'Unknown',
      value: 123
    };
    
    // Validate the data
    expect(() => validator.validateVertex('Unknown', unknownData)).toThrow(ValidationErrorCollection);
    
    try {
      validator.validateVertex('Unknown', unknownData);
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationErrorCollection);
      expect(error.errors).toHaveLength(1);
      expect(error.errors[0]).toBeInstanceOf(SchemaValidationError);
      expect(error.errors[0].message).toContain('Unknown vertex label');
    }
  });
  
  it('should validate a valid edge against the schema', () => {
    // Load the basic schema
    const schema = loadSchemaFixture('basic-schema');
    const validator = new SchemaValidator(schema);
    
    // Valid purchase edge data
    const purchaseData = {
      date: new Date('2023-01-01'),
      quantity: 2,
      total: 199.99
    };
    
    // Validate the data
    expect(() => validator.validateEdge('PURCHASED', purchaseData)).not.toThrow();
  });
  
  it('should reject an invalid edge missing required properties', () => {
    // Load the basic schema
    const schema = loadSchemaFixture('basic-schema');
    const validator = new SchemaValidator(schema);
    
    // Invalid purchase edge data (missing required quantity)
    const invalidPurchaseData = {
      date: new Date('2023-01-01'),
      total: 199.99
    };
    
    // Validate the data
    expect(() => validator.validateEdge('PURCHASED', invalidPurchaseData)).toThrow(ValidationErrorCollection);
    
    try {
      validator.validateEdge('PURCHASED', invalidPurchaseData);
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationErrorCollection);
      expect(error.errors).toHaveLength(1);
      expect(error.errors[0]).toBeInstanceOf(SchemaValidationError);
      expect(error.errors[0].message).toContain('quantity');
    }
  });
  
  it('should validate complex nested objects', () => {
    // Load the complex schema
    const schema = loadSchemaFixture('complex-schema');
    const validator = new SchemaValidator(schema);
    
    // Valid user data with nested preferences
    const userData = {
      id: '123',
      username: 'johndoe',
      email: 'john@example.com',
      firstName: 'John',
      lastName: 'Doe',
      birthDate: new Date('1990-01-01'),
      active: true,
      preferences: {
        theme: 'dark',
        notifications: true
      }
    };
    
    // Validate the data
    expect(() => validator.validateVertex('User', userData)).not.toThrow();
    
    // Invalid nested object
    const invalidUserData = {
      id: '123',
      username: 'johndoe',
      email: 'john@example.com',
      preferences: {
        theme: 123, // Should be a string
        notifications: true
      }
    };
    
    // Validate the data
    expect(() => validator.validateVertex('User', invalidUserData)).toThrow(ValidationErrorCollection);
    
    try {
      validator.validateVertex('User', invalidUserData);
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationErrorCollection);
      expect(error.errors.length).toBeGreaterThan(0);
      
      // Find the error for the theme property
      const themeError = error.errors.find(e => e.message.includes('theme'));
      expect(themeError).toBeDefined();
      expect(themeError!.message).toContain('type');
    }
  });
  
  it('should validate array properties', () => {
    // Load the complex schema
    const schema = loadSchemaFixture('complex-schema');
    const validator = new SchemaValidator(schema);
    
    // Valid post data with tags array
    const postData = {
      id: '123',
      title: 'Test Post',
      content: 'This is a test post',
      createdAt: new Date(),
      tags: ['test', 'integration', 'schema']
    };
    
    // Validate the data
    expect(() => validator.validateVertex('Post', postData)).not.toThrow();
    
    // Invalid array items
    const invalidPostData = {
      id: '123',
      title: 'Test Post',
      content: 'This is a test post',
      createdAt: new Date(),
      tags: ['test', 123, true] // Should all be strings
    };
    
    // Validate the data
    expect(() => validator.validateVertex('Post', invalidPostData)).toThrow(ValidationErrorCollection);
  });
  
  it('should handle nullable properties', () => {
    // Load the complex schema
    const schema = loadSchemaFixture('complex-schema');
    const validator = new SchemaValidator(schema);
    
    // Valid user data with null lastLogin
    const userData = {
      id: '123',
      username: 'johndoe',
      email: 'john@example.com',
      lastLogin: null
    };
    
    // Validate the data
    expect(() => validator.validateVertex('User', userData)).not.toThrow();
    
    // Valid post data with null tags
    const postData = {
      id: '123',
      title: 'Test Post',
      content: 'This is a test post',
      createdAt: new Date(),
      tags: null
    };
    
    // Validate the data
    expect(() => validator.validateVertex('Post', postData)).not.toThrow();
  });
});
