/**
 * Test fixtures for ageSchemaClient
 * 
 * @packageDocumentation
 */

import fs from 'fs';
import path from 'path';
import { Schema } from '../../src/schema/types';

/**
 * Load a schema fixture from the fixtures directory
 * 
 * @param name - Name of the fixture to load
 * @returns The loaded schema
 */
export function loadSchemaFixture(name: string): Schema {
  const fixturePath = path.join(__dirname, `${name}.json`);
  
  if (!fs.existsSync(fixturePath)) {
    throw new Error(`Schema fixture '${name}' not found at ${fixturePath}`);
  }
  
  const fixtureContent = fs.readFileSync(fixturePath, 'utf-8');
  return JSON.parse(fixtureContent) as Schema;
}

/**
 * Get the path to a fixture file
 * 
 * @param name - Name of the fixture file
 * @returns The absolute path to the fixture file
 */
export function getFixturePath(name: string): string {
  return path.join(__dirname, name);
}
