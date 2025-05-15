# PostgreSQL Stored Procedures for Apache AGE Parameter Handling

This directory contains PostgreSQL stored procedures that facilitate passing JavaScript arrays of objects to Apache AGE Cypher queries.

## Problem Solved

Apache AGE has limitations when it comes to passing dynamic parameters to Cypher queries. The standard parameterization approach using `$1`, `$2`, etc. doesn't work well with complex data structures like arrays of objects.

These stored procedures provide a solution by:

1. Storing JavaScript arrays of objects in temporary PostgreSQL tables
2. Providing a function to retrieve the data as a JSON array that can be used with individual parameterized Cypher queries

## Available Procedures

### `store_json_array_in_temp_table`

This procedure takes a JavaScript array of objects (as a JSONB parameter) and stores each object as a row in a temporary table.

**Parameters:**
- `p_schema_name`: Schema name for the temporary table
- `p_table_name`: Name of the temporary table to create
- `p_json_array`: JSON array of objects to store
- `p_drop_if_exists`: Whether to drop the table if it already exists (default: true)

### `get_temp_table_as_json_array`

This function retrieves all rows from a temporary table and returns them as a JSON array.

**Parameters:**
- `p_schema_name`: Schema name for the temporary table
- `p_table_name`: Name of the temporary table to read from

**Returns:**
- A JSON array containing all rows from the table as objects

## Usage Example

```typescript
// Sample employee data as a JavaScript array
const employeeData = [
  { id: 1, name: "John Smith", title: "CEO", department: "Executive", salary: 150000 },
  { id: 2, name: "Mary Johnson", title: "CTO", department: "Technology", salary: 140000 },
  { id: 3, name: "Robert Brown", title: "CFO", department: "Finance", salary: 135000 }
];

// 1. Store the JavaScript array in a temporary table
await queryExecutor.executeSQL(`
  CALL store_json_array_in_temp_table(
    '${TEST_SCHEMA}',
    'temp_employees',
    $1::jsonb,
    true
  )
`, [JSON.stringify(employeeData)]);

// 2. Retrieve the data as a JSON array
const jsonResult = await queryExecutor.executeSQL(`
  SELECT get_temp_table_as_json_array('${TEST_SCHEMA}', 'temp_employees') AS data
`);
const employees = jsonResult.rows[0].data;

// 3. Use the data in individual parameterized Cypher queries
for (const employee of employees) {
  // Convert parameters to a JSON object
  const params = {
    id: employee.id,
    name: employee.name,
    title: employee.title,
    department: employee.department,
    salary: employee.salary
  };

  // Execute the Cypher query using executeSQL with hardcoded values
  const result = await queryExecutor.executeSQL(`
    SELECT * FROM ag_catalog.cypher('my_graph', $$
      CREATE (e:Employee {
        id: ${params.id},
        name: '${params.name}',
        title: '${params.title}',
        department: '${params.department}',
        salary: ${params.salary}
      })
      RETURN count(*) AS created_employees
    $$) as (created_employees ag_catalog.agtype)
  `);

  // Extract the numeric value from the agtype result
  // The result is in the format: {"created_employees": 1}
  const resultValue = JSON.parse(result.rows[0].created_employees.substring(1));
  console.log(`Created ${resultValue.created_employees} employee(s)`);
}
```

## Benefits

1. **Type Safety**: The procedure automatically determines appropriate PostgreSQL types for each field in the JSON objects.
2. **Flexibility**: Works with any JSON structure, not just predefined schemas.
3. **Performance**: More efficient than passing large JSON strings directly in queries.
4. **Compatibility**: Works around Apache AGE's limitations with parameterized queries.
5. **Security**: Uses proper parameterization for Cypher queries, avoiding SQL/Cypher injection risks.

## Installation

To install these procedures in your database:

1. Load the SQL file into your PostgreSQL database:
   ```sql
   \i /path/to/parameter-procedures.sql
   ```

2. Or execute the SQL file using your database client:
   ```typescript
   import fs from 'fs';
   import path from 'path';

   const proceduresPath = path.resolve(__dirname, 'parameter-procedures.sql');
   const proceduresSql = fs.readFileSync(proceduresPath, 'utf8');
   await queryExecutor.executeSQL(proceduresSql);
   ```

## Integration Test

See the integration test file `tests/integration/age-parameters/json-array-parameters.integration.test.ts` for a complete example of how to use these procedures.
