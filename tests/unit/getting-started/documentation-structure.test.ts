/**
 * Unit tests for Getting Started Guide Documentation Structure
 * 
 * These tests verify that the getting started documentation files exist,
 * have proper structure, and contain the expected content sections.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const DOCS_PATH = path.join(process.cwd(), 'website', 'docs', 'getting-started');

describe('Getting Started Documentation Structure', () => {
  describe('File Existence', () => {
    it('should have all required getting started files', () => {
      const requiredFiles = [
        '_category_.json',
        'installation.md',
        'basic-usage.md',
        'connection-config.md',
        'first-graph.md'
      ];

      requiredFiles.forEach(file => {
        const filePath = path.join(DOCS_PATH, file);
        expect(fs.existsSync(filePath), `File ${file} should exist`).toBe(true);
      });
    });

    it('should have proper category configuration', () => {
      const categoryPath = path.join(DOCS_PATH, '_category_.json');
      const categoryContent = JSON.parse(fs.readFileSync(categoryPath, 'utf-8'));

      expect(categoryContent).toHaveProperty('label');
      expect(categoryContent).toHaveProperty('position');
      expect(categoryContent).toHaveProperty('link');
      expect(categoryContent.label).toBe('Getting Started');
      expect(categoryContent.position).toBe(2);
    });
  });

  describe('Installation Guide Content', () => {
    let installationContent: string;

    beforeAll(() => {
      const installationPath = path.join(DOCS_PATH, 'installation.md');
      installationContent = fs.readFileSync(installationPath, 'utf-8');
    });

    it('should have proper title and introduction', () => {
      expect(installationContent).toContain('# Installation');
      expect(installationContent).toContain('This guide will help you install and set up ageSchemaClient');
    });

    it('should include prerequisites section', () => {
      expect(installationContent).toContain('## Prerequisites');
      expect(installationContent).toContain('Node.js 16.0+');
      expect(installationContent).toContain('Apache AGE');
      expect(installationContent).toContain('TypeScript 4.5+');
    });

    it('should include installation instructions for all package managers', () => {
      expect(installationContent).toContain('npm install age-schema-client');
      expect(installationContent).toContain('yarn add age-schema-client');
      expect(installationContent).toContain('pnpm add age-schema-client');
    });

    it('should include Apache AGE setup instructions', () => {
      expect(installationContent).toContain('## Apache AGE Setup');
      expect(installationContent).toContain('CREATE EXTENSION IF NOT EXISTS age');
      expect(installationContent).toContain('LOAD \'age\'');
      expect(installationContent).toContain('SET search_path = ag_catalog');
    });

    it('should include basic configuration example', () => {
      expect(installationContent).toContain('## Basic Configuration');
      expect(installationContent).toContain('new AgeSchemaClient');
      expect(installationContent).toContain('host:');
      expect(installationContent).toContain('port:');
      expect(installationContent).toContain('database:');
    });

    it('should include environment variables section', () => {
      expect(installationContent).toContain('## Environment Variables');
      expect(installationContent).toContain('AGE_HOST');
      expect(installationContent).toContain('AGE_PORT');
      expect(installationContent).toContain('process.env.AGE_HOST');
    });

    it('should include verification section', () => {
      expect(installationContent).toContain('## Verification');
      expect(installationContent).toContain('testConnection');
      expect(installationContent).toContain('.execute()');
    });

    it('should include troubleshooting section', () => {
      expect(installationContent).toContain('## Troubleshooting');
      expect(installationContent).toContain('Common Issues');
      expect(installationContent).toContain('AGE extension not found');
      expect(installationContent).toContain('Connection refused');
    });
  });

  describe('Basic Usage Guide Content', () => {
    let basicUsageContent: string;

    beforeAll(() => {
      const basicUsagePath = path.join(DOCS_PATH, 'basic-usage.md');
      basicUsageContent = fs.readFileSync(basicUsagePath, 'utf-8');
    });

    it('should have proper title and introduction', () => {
      expect(basicUsageContent).toContain('# Basic Usage');
      expect(basicUsageContent).toContain('Learn the fundamentals of using ageSchemaClient');
    });

    it('should include quick start section', () => {
      expect(basicUsageContent).toContain('## Quick Start');
      expect(basicUsageContent).toContain('import { AgeSchemaClient }');
      expect(basicUsageContent).toContain('await client.connect()');
      expect(basicUsageContent).toContain('await client.disconnect()');
    });

    it('should include core concepts section', () => {
      expect(basicUsageContent).toContain('## Core Concepts');
      expect(basicUsageContent).toContain('### Client Instance');
      expect(basicUsageContent).toContain('### Query Builder');
      expect(basicUsageContent).toContain('### Connection Management');
    });

    it('should include working with vertices section', () => {
      expect(basicUsageContent).toContain('## Working with Vertices');
      expect(basicUsageContent).toContain('### Creating Vertices');
      expect(basicUsageContent).toContain('### Querying Vertices');
      expect(basicUsageContent).toContain('.create(');
      expect(basicUsageContent).toContain('.match(');
      expect(basicUsageContent).toContain('.setParam(');
    });

    it('should include working with edges section', () => {
      expect(basicUsageContent).toContain('## Working with Edges');
      expect(basicUsageContent).toContain('### Creating Relationships');
      expect(basicUsageContent).toContain('### Querying Relationships');
      expect(basicUsageContent).toContain('-[r:KNOWS]-');
    });

    it('should include schema validation section', () => {
      expect(basicUsageContent).toContain('## Schema Validation');
      expect(basicUsageContent).toContain('client.setSchema(schema)');
      expect(basicUsageContent).toContain('vertices:');
      expect(basicUsageContent).toContain('edges:');
    });

    it('should include error handling section', () => {
      expect(basicUsageContent).toContain('## Error Handling');
      expect(basicUsageContent).toContain('try {');
      expect(basicUsageContent).toContain('catch (error)');
      expect(basicUsageContent).toContain('SCHEMA_VALIDATION_ERROR');
    });

    it('should include best practices section', () => {
      expect(basicUsageContent).toContain('## Best Practices');
      expect(basicUsageContent).toContain('### 1. Use Parameters');
      expect(basicUsageContent).toContain('### 2. Use Transactions');
      expect(basicUsageContent).toContain('### 3. Close Connections');
      expect(basicUsageContent).toContain('✅ Good');
      expect(basicUsageContent).toContain('❌ Bad');
    });
  });

  describe('Connection Configuration Guide Content', () => {
    let connectionConfigContent: string;

    beforeAll(() => {
      const connectionConfigPath = path.join(DOCS_PATH, 'connection-config.md');
      connectionConfigContent = fs.readFileSync(connectionConfigPath, 'utf-8');
    });

    it('should have proper title and introduction', () => {
      expect(connectionConfigContent).toContain('# Connection Configuration');
      expect(connectionConfigContent).toContain('Advanced configuration options');
    });

    it('should include SSL configuration section', () => {
      expect(connectionConfigContent).toContain('### SSL Configuration');
      expect(connectionConfigContent).toContain('ssl: {');
      expect(connectionConfigContent).toContain('rejectUnauthorized');
      expect(connectionConfigContent).toContain('ca:');
      expect(connectionConfigContent).toContain('key:');
      expect(connectionConfigContent).toContain('cert:');
    });

    it('should include cloud provider SSL examples', () => {
      expect(connectionConfigContent).toContain('AWS RDS:');
      expect(connectionConfigContent).toContain('Google Cloud SQL:');
      expect(connectionConfigContent).toContain('rds-ca-2019-root.pem');
    });

    it('should include connection pool settings', () => {
      expect(connectionConfigContent).toContain('### Connection Pool Settings');
      expect(connectionConfigContent).toContain('pool: {');
      expect(connectionConfigContent).toContain('min:');
      expect(connectionConfigContent).toContain('max:');
      expect(connectionConfigContent).toContain('idleTimeoutMillis:');
    });

    it('should include environment-specific configurations', () => {
      expect(connectionConfigContent).toContain('### Environment-Specific Configurations');
      expect(connectionConfigContent).toContain('Development (.env.development)');
      expect(connectionConfigContent).toContain('Testing (.env.test)');
      expect(connectionConfigContent).toContain('Production (.env.production)');
    });

    it('should include performance tuning section', () => {
      expect(connectionConfigContent).toContain('## Performance Tuning');
      expect(connectionConfigContent).toContain('### Connection Pool Optimization');
      expect(connectionConfigContent).toContain('### Query Performance');
    });

    it('should include security best practices', () => {
      expect(connectionConfigContent).toContain('## Security Best Practices');
      expect(connectionConfigContent).toContain('### Secure Configuration');
      expect(connectionConfigContent).toContain('### Connection String Security');
      expect(connectionConfigContent).toContain('Never expose sensitive information');
    });

    it('should include troubleshooting section', () => {
      expect(connectionConfigContent).toContain('## Troubleshooting');
      expect(connectionConfigContent).toContain('Connection Timeout:');
      expect(connectionConfigContent).toContain('SSL Certificate Issues:');
      expect(connectionConfigContent).toContain('Pool Exhaustion:');
    });
  });

  describe('First Graph Guide Content', () => {
    let firstGraphContent: string;

    beforeAll(() => {
      const firstGraphPath = path.join(DOCS_PATH, 'first-graph.md');
      firstGraphContent = fs.readFileSync(firstGraphPath, 'utf-8');
    });

    it('should have proper title and introduction', () => {
      expect(firstGraphContent).toContain('# Your First Graph');
      expect(firstGraphContent).toContain('Create and populate your first graph database');
    });

    it('should include what we will build section', () => {
      expect(firstGraphContent).toContain('## What We\'ll Build');
      expect(firstGraphContent).toContain('People');
      expect(firstGraphContent).toContain('Relationships');
      expect(firstGraphContent).toContain('Companies');
    });

    it('should include prerequisites section', () => {
      expect(firstGraphContent).toContain('## Prerequisites');
      expect(firstGraphContent).toContain('ageSchemaClient installed');
      expect(firstGraphContent).toContain('Apache AGE database running');
    });

    it('should include graph creation section', () => {
      expect(firstGraphContent).toContain('## Creating a Graph');
      expect(firstGraphContent).toContain('createGraph(');
      expect(firstGraphContent).toContain('useGraph(');
      expect(firstGraphContent).toContain('social_network');
    });

    it('should include comprehensive vertex examples', () => {
      expect(firstGraphContent).toContain('## Adding Vertices');
      expect(firstGraphContent).toContain('### Creating Individual Vertices');
      expect(firstGraphContent).toContain('### Creating Multiple Vertices at Once');
      expect(firstGraphContent).toContain('### Adding Company Vertices');
      expect(firstGraphContent).toContain('Alice Johnson');
      expect(firstGraphContent).toContain('TechCorp');
    });

    it('should include comprehensive relationship examples', () => {
      expect(firstGraphContent).toContain('## Adding Relationships');
      expect(firstGraphContent).toContain('### Social Relationships');
      expect(firstGraphContent).toContain('### Employment Relationships');
      expect(firstGraphContent).toContain('### Bidirectional Relationships');
      expect(firstGraphContent).toContain('WORKS_AT');
    });

    it('should include comprehensive querying examples', () => {
      expect(firstGraphContent).toContain('## Querying Your Graph');
      expect(firstGraphContent).toContain('### Basic Queries');
      expect(firstGraphContent).toContain('### Relationship Queries');
      expect(firstGraphContent).toContain('### Advanced Queries');
      expect(firstGraphContent).toContain('### Analytical Queries');
      expect(firstGraphContent).toContain('shortestPath');
      expect(firstGraphContent).toContain('friends of friends');
    });

    it('should include batch loading section', () => {
      expect(firstGraphContent).toContain('## Batch Loading');
      expect(firstGraphContent).toContain('batch loader');
      expect(firstGraphContent).toContain('loadVertices');
      expect(firstGraphContent).toContain('loadEdges');
      expect(firstGraphContent).toContain('Grace Hopper');
      expect(firstGraphContent).toContain('Alan Turing');
    });

    it('should include data validation section', () => {
      expect(firstGraphContent).toContain('## Data Validation and Schema');
      expect(firstGraphContent).toContain('schema validation');
      expect(firstGraphContent).toContain('required: true');
      expect(firstGraphContent).toContain('type: \'string\'');
    });

    it('should include update and delete examples', () => {
      expect(firstGraphContent).toContain('## Updating and Deleting Data');
      expect(firstGraphContent).toContain('### Updating Vertices and Edges');
      expect(firstGraphContent).toContain('### Deleting Data');
      expect(firstGraphContent).toContain('.set(');
      expect(firstGraphContent).toContain('.delete(');
      expect(firstGraphContent).toContain('detachDelete');
    });

    it('should include complete example', () => {
      expect(firstGraphContent).toContain('## Complete Example');
      expect(firstGraphContent).toContain('createSocialNetwork');
      expect(firstGraphContent).toContain('async function');
    });

    it('should include comprehensive next steps', () => {
      expect(firstGraphContent).toContain('## Next Steps');
      expect(firstGraphContent).toContain('### Continue Learning');
      expect(firstGraphContent).toContain('### Example Projects');
      expect(firstGraphContent).toContain('### Get Help');
      expect(firstGraphContent).toContain('Social Network Analysis');
      expect(firstGraphContent).toContain('Recommendation Engine');
      expect(firstGraphContent).toContain('Knowledge Graph');
    });
  });

  describe('Cross-References and Navigation', () => {
    it('should have proper cross-references between guides', () => {
      const files = ['installation.md', 'basic-usage.md', 'connection-config.md', 'first-graph.md'];
      
      files.forEach(file => {
        const filePath = path.join(DOCS_PATH, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Each file should have next steps or references to other guides
        expect(content).toMatch(/\[.*\]\(\.\/.*\)/); // Relative links to other guides
      });
    });

    it('should have consistent link formats', () => {
      const files = ['installation.md', 'basic-usage.md', 'connection-config.md', 'first-graph.md'];
      
      files.forEach(file => {
        const filePath = path.join(DOCS_PATH, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Check for consistent internal link format
        const internalLinks = content.match(/\[.*\]\(\.\/[^)]+\)/g) || [];
        internalLinks.forEach(link => {
          expect(link).not.toContain('.md'); // Should not include .md extension
        });
      });
    });
  });
});
