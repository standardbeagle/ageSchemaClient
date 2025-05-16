/**
 * Minimal integration test for Apache AGE
 *
 * This test demonstrates the most basic approach to using Apache AGE
 * without any parameter passing.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  queryExecutor,
  isAgeAvailable,
  TEST_SCHEMA
} from '../../setup/integration';

// Graph name for the parameter tests
const PARAM_TEST_GRAPH = 'param_test_graph';

describe('Apache AGE - Minimal Test', () => {
  let ageAvailable = false;

  // Set up the test environment
  beforeAll(async () => {
    // Check if AGE is available
    ageAvailable = await isAgeAvailable();

    if (!ageAvailable) {
      console.warn('Apache AGE extension is not available, tests will be skipped');
      return;
    }

    // Drop the test graph if it exists
    try {
      await queryExecutor.executeSQL(`SELECT * FROM ag_catalog.drop_graph('${PARAM_TEST_GRAPH}', true)`);
    } catch (error) {
      console.warn(`Warning: Could not drop graph ${PARAM_TEST_GRAPH}: ${error.message}`);
    }

    // Create the test graph
    try {
      await queryExecutor.executeSQL(`SELECT * FROM ag_catalog.create_graph('${PARAM_TEST_GRAPH}')`);
    } catch (error) {
      console.error(`Error creating graph ${PARAM_TEST_GRAPH}: ${error.message}`);
      ageAvailable = false;
    }
  }, 15000); // Increase timeout to 15 seconds

  // Clean up after all tests
  afterAll(async () => {
    if (!ageAvailable) return;

    // Drop the test graph
    try {
      await queryExecutor.executeSQL(`SELECT * FROM ag_catalog.drop_graph('${PARAM_TEST_GRAPH}', true)`);
    } catch (error) {
      console.warn(`Warning: Could not drop graph ${PARAM_TEST_GRAPH}: ${error.message}`);
    }
  });

  // Test: Create a vertex and return it as an object
  it('should create a vertex and return it as an object', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    try {
      // Create a vertex with properties
      const createResult = await queryExecutor.executeSQL(`
        SELECT * FROM ag_catalog.cypher('${PARAM_TEST_GRAPH}', $$
          CREATE (p:Person {
            name: 'John Doe',
            age: 30,
            email: 'john@example.com',
            active: true
          })
          RETURN p as person
        $$) as (person ag_catalog.agtype);
      `);

      // Verify the query executed successfully
      expect(createResult.rows).toHaveLength(1);
      expect(createResult.rows[0].person).toBeDefined();

      // The person object is returned as an agtype, which is a JSON-like structure
      // We can access its properties to verify it was created correctly
      const personObj = createResult.rows[0].person;
      console.log('Person object:', personObj);

      // Query all Person vertices and return them as objects
      const queryResult = await queryExecutor.executeSQL(`
        SELECT * FROM ag_catalog.cypher('${PARAM_TEST_GRAPH}', $$
          MATCH (p:Person)
          RETURN p as person
        $$) as (person ag_catalog.agtype);
      `);

      // Verify we got at least one result
      expect(queryResult.rows.length).toBeGreaterThan(0);

      // Log all returned persons for debugging
      console.log('All persons:', queryResult.rows);

      // Define a type for the person object
      type PersonVertex = {
        id: number;
        label: string;
        properties: {
          name: string;
          age: number;
          email: string;
          active: boolean;
        };
      };

      // Find the person with name 'John Doe'
      let johnDoe: PersonVertex | null = null;

      for (const row of queryResult.rows) {
        const person = row.person;
        console.log('Checking person:', person);

        // Check if this is the person we're looking for
        try {
          // Handle the case where the person is returned as a string
          if (typeof person === 'string') {
            // Remove the ::vertex suffix if present
            const cleanString = person.replace(/::vertex$/, '');
            try {
              const parsedPerson = JSON.parse(cleanString);
              if (parsedPerson.properties &&
                  parsedPerson.properties.name === 'John Doe') {
                johnDoe = parsedPerson as PersonVertex;
                break;
              }
            } catch (parseError) {
              console.error('Error parsing person string:', parseError);
            }
          }
          // Handle the case where the person is returned as an object
          else if (typeof person === 'object' &&
              person !== null &&
              'properties' in person &&
              person.properties &&
              'name' in person.properties &&
              person.properties.name === 'John Doe') {
            johnDoe = person as PersonVertex;
            break;
          }
        } catch (e) {
          console.error('Error checking person:', e);
        }
      }

      // Verify we found John Doe
      if (johnDoe === null) {
        // If we didn't find John Doe, log more details for debugging
        console.error('Could not find John Doe in the results');
        console.error('Results:', queryResult.rows);
        // This will fail the test
        expect(johnDoe).not.toBeNull();
      } else {
        console.log('Found John Doe:', johnDoe);
      }

      // Verify the properties (only if johnDoe is not null)
      if (johnDoe) {
        expect(johnDoe.properties.name).toBe('John Doe');
        expect(johnDoe.properties.age).toBe(30);
        expect(johnDoe.properties.email).toBe('john@example.com');
        expect(johnDoe.properties.active).toBe(true);
      }
    } catch (error) {
      console.error('Error executing Cypher query:', error);
      throw error;
    }
  });
});
