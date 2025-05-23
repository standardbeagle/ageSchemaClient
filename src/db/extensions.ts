/**
 * Extension initializers for PostgreSQL extensions
 * 
 * This file contains implementations of ExtensionInitializer for common
 * PostgreSQL extensions like Apache AGE, pgvector, PostGIS, and search path management.
 * 
 * Prompt Log:
 * - Initial creation: Added extension system to allow pluggable initialization of PostgreSQL extensions
 * 
 * @packageDocumentation
 */

import { PoolClient } from 'pg';
import { ExtensionInitializer, ConnectionConfig } from './types';

/**
 * Apache AGE extension initializer
 * 
 * This initializer loads the Apache AGE extension, sets up the search path,
 * creates the age_params temporary table, and initializes AGE-specific functions.
 */
export class AgeExtensionInitializer implements ExtensionInitializer {
  readonly name = 'Apache AGE';

  async initialize(client: PoolClient, config: ConnectionConfig): Promise<void> {
    try {
      const searchPath = config.pgOptions?.searchPath || 'ag_catalog, "$user", public';

      // Use a single query to initialize the connection
      // This ensures all setup is done atomically
      await client.query(`
        -- Load AGE extension
        LOAD 'age';

        -- Set search path
        SET search_path TO ${searchPath};

        -- Create temp table for parameters
        CREATE TEMP TABLE IF NOT EXISTS age_params(key text, value jsonb);
        ALTER TABLE age_params ADD PRIMARY KEY (key);
      `);

      // Verify search path was set correctly
      await client.query('SHOW search_path');

      // Initialize the age_schema_client schema if it doesn't exist
      await this.initializeAgeParamsFunctions(client);

      // Mark this connection as initialized
      // @ts-ignore - Adding custom property to track initialization
      client._ageInitialized = true;
    } catch (error) {
      console.error('Error initializing Apache AGE extension:', error);
      throw error;
    }
  }

  async cleanup(client: PoolClient, config: ConnectionConfig): Promise<void> {
    try {
      // Truncate the age_params table before releasing the connection
      await client.query('TRUNCATE TABLE age_params');
    } catch (error) {
      console.warn('Failed to truncate age_params table:', error);
      // Continue with cleanup even if truncate fails
    }
  }

  /**
   * Initialize the age_params functions
   *
   * This method creates the age_schema_client schema if it doesn't exist
   * and creates the functions to retrieve parameters from the age_params table.
   *
   * @param client - Pool client
   */
  private async initializeAgeParamsFunctions(client: PoolClient): Promise<void> {
    try {
      // Create the age_schema_client schema if it doesn't exist
      await client.query(`
        CREATE SCHEMA IF NOT EXISTS age_schema_client;
      `);

      // Create the functions to retrieve parameters from the age_params table
      await client.query(`
        -- Function to retrieve a single parameter from the age_params table
        -- This function accepts a text parameter
        CREATE OR REPLACE FUNCTION age_schema_client.get_age_param(param_key text)
        RETURNS ag_catalog.agtype AS $$
        DECLARE
          result_json JSONB;
        BEGIN
          -- Get the parameter value
          SELECT value INTO result_json
          FROM age_params
          WHERE key = param_key;

          -- Return null if the parameter doesn't exist
          IF result_json IS NULL THEN
            RETURN NULL;
          END IF;

          -- Return as agtype
          RETURN result_json::text::ag_catalog.agtype;
        END;
        $$ LANGUAGE plpgsql;

        -- Function to retrieve a single parameter from the age_params table
        -- This function accepts an agtype parameter
        CREATE OR REPLACE FUNCTION age_schema_client.get_age_param(param_key ag_catalog.agtype)
        RETURNS ag_catalog.agtype AS $$
        DECLARE
          key_text TEXT;
          result_json JSONB;
        BEGIN
          -- Convert agtype to text
          key_text := param_key::text;
          -- Remove quotes if present
          key_text := REPLACE(key_text, '"', '');

          -- Get the parameter value
          SELECT value INTO result_json
          FROM age_params
          WHERE key = key_text;

          -- Return null if the parameter doesn't exist
          IF result_json IS NULL THEN
            RETURN NULL;
          END IF;

          -- Return as agtype
          RETURN result_json::text::ag_catalog.agtype;
        END;
        $$ LANGUAGE plpgsql;

        -- Function to retrieve all parameters from the age_params table
        CREATE OR REPLACE FUNCTION age_schema_client.get_all_age_params()
        RETURNS ag_catalog.agtype AS $$
        DECLARE
          result_json JSONB;
        BEGIN
          -- Use jsonb_object_agg to convert rows to a single JSONB object
          SELECT jsonb_object_agg(key, value)
          INTO result_json
          FROM age_params;

          -- Return empty object if no parameters exist
          IF result_json IS NULL THEN
            RETURN '{}'::text::ag_catalog.agtype;
          END IF;

          -- Return as agtype
          RETURN result_json::text::ag_catalog.agtype;
        END;
        $$ LANGUAGE plpgsql;

        -- Function to retrieve vertex data by type from the age_params table
        CREATE OR REPLACE FUNCTION age_schema_client.get_vertices(vertex_type ag_catalog.agtype)
        RETURNS ag_catalog.agtype AS $$
        DECLARE
          vertex_type_text TEXT;
          result_array JSONB;
        BEGIN
          -- Extract the text value from the agtype parameter
          SELECT vertex_type::text INTO vertex_type_text;

          -- Remove quotes if present
          vertex_type_text := REPLACE(REPLACE(vertex_type_text, '"', ''), '''', '');

          -- Get the data for the specified vertex type
          SELECT value
          INTO result_array
          FROM age_params
          WHERE key = 'vertex_' || vertex_type_text;

          -- Return null if no data found
          IF result_array IS NULL THEN
            RETURN NULL;
          END IF;

          -- Return as agtype
          RETURN result_array::text::ag_catalog.agtype;
        END;
        $$ LANGUAGE plpgsql;

        -- Function to retrieve edge data by type from the age_params table
        CREATE OR REPLACE FUNCTION age_schema_client.get_edges(edge_type ag_catalog.agtype)
        RETURNS ag_catalog.agtype AS $$
        DECLARE
          edge_type_text TEXT;
          result_array JSONB;
        BEGIN
          -- Extract the text value from the agtype parameter
          SELECT edge_type::text INTO edge_type_text;

          -- Remove quotes if present
          edge_type_text := REPLACE(REPLACE(edge_type_text, '"', ''), '''', '');

          -- Get the data for the specified edge type
          SELECT value
          INTO result_array
          FROM age_params
          WHERE key = 'edge_' || edge_type_text;

          -- Return null if no data found
          IF result_array IS NULL THEN
            RETURN NULL;
          END IF;

          -- Return as agtype
          RETURN result_array::text::ag_catalog.agtype;
        END;
        $$ LANGUAGE plpgsql;
      `);
    } catch (error) {
      console.error('Error initializing age_params functions:', error);
      throw error;
    }
  }
}

/**
 * pgvector extension initializer
 * 
 * This initializer loads the pgvector extension for vector similarity search.
 */
export class PgVectorExtensionInitializer implements ExtensionInitializer {
  readonly name = 'pgvector';

  async initialize(client: PoolClient, config: ConnectionConfig): Promise<void> {
    try {
      // Create the pgvector extension if it doesn't exist
      await client.query('CREATE EXTENSION IF NOT EXISTS vector');
      
      // Mark this connection as pgvector initialized
      // @ts-ignore - Adding custom property to track initialization
      client._pgvectorInitialized = true;
    } catch (error) {
      console.error('Error initializing pgvector extension:', error);
      throw error;
    }
  }
}

/**
 * PostGIS extension initializer
 * 
 * This initializer loads the PostGIS extension for spatial data support.
 */
export class PostGISExtensionInitializer implements ExtensionInitializer {
  readonly name = 'PostGIS';

  async initialize(client: PoolClient, config: ConnectionConfig): Promise<void> {
    try {
      // Create the PostGIS extension if it doesn't exist
      await client.query('CREATE EXTENSION IF NOT EXISTS postgis');
      
      // Mark this connection as PostGIS initialized
      // @ts-ignore - Adding custom property to track initialization
      client._postgisInitialized = true;
    } catch (error) {
      console.error('Error initializing PostGIS extension:', error);
      throw error;
    }
  }
}

/**
 * Search path initializer
 * 
 * This initializer sets up custom search paths for PostgreSQL schemas.
 * It can be used to add additional schemas to the search path beyond what's
 * configured in pgOptions.searchPath.
 */
export class SearchPathInitializer implements ExtensionInitializer {
  readonly name = 'Search Path';
  private additionalSchemas: string[];

  constructor(additionalSchemas: string[]) {
    this.additionalSchemas = additionalSchemas;
  }

  async initialize(client: PoolClient, config: ConnectionConfig): Promise<void> {
    try {
      if (this.additionalSchemas.length === 0) {
        return;
      }

      const currentSearchPath = config.pgOptions?.searchPath || 'ag_catalog, "$user", public';
      const newSearchPath = `${currentSearchPath}, ${this.additionalSchemas.join(', ')}`;
      
      // Set the extended search path
      await client.query(`SET search_path TO ${newSearchPath}`);
      
      // Mark this connection as search path initialized
      // @ts-ignore - Adding custom property to track initialization
      client._searchPathInitialized = true;
    } catch (error) {
      console.error('Error initializing search path:', error);
      throw error;
    }
  }
}
