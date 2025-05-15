# SQL Execution Scripts

This directory contains scripts to run SQL commands against the PostgreSQL database configured in `.env.test`.

## Prerequisites

1. Make sure you have PostgreSQL client tools (`psql`) installed on your system.
2. Ensure the `.env.test` file is properly configured with your database connection details.

## Available Scripts

### 1. Run SQL Command

The `run-sql-command.sh` script allows you to execute a single SQL command directly from the command line.

**Usage:**
```bash
./scripts/run-sql-command.sh "SQL command"
```

**Example:**
```bash
./scripts/run-sql-command.sh "SELECT version();"
./scripts/run-sql-command.sh "SELECT * FROM pg_available_extensions WHERE name = 'age';"
```

### 2. Run SQL File

The `run-sql-file.sh` script allows you to execute SQL commands from a file.

**Usage:**
```bash
./scripts/run-sql-file.sh path/to/sql/file.sql
```

**Example:**
```bash
./scripts/run-sql-file.sh scripts/basic-test.sql
./scripts/run-sql-file.sh setup_age_db.sql
```

### 3. List AGE Graphs

The `list-age-graphs.sql` script lists all Apache AGE graphs defined in the current database.

**Usage:**
```bash
./scripts/run-sql-file.sh scripts/list-age-graphs.sql
```

### 4. Get Graph Details

The `get-graph-details.sh` script provides detailed information about a specific Apache AGE graph.

**Usage:**
```bash
./scripts/get-graph-details.sh graph_name
```

**Example:**
```bash
./scripts/get-graph-details.sh test_graph
```

### 5. Run Cypher Query

The `run-cypher.sh` script allows you to execute Cypher queries on Apache AGE graphs.

**Usage:**
```bash
./scripts/run-cypher.sh "CYPHER QUERY" [GRAPH_NAME]
```

**Example:**
```bash
./scripts/run-cypher.sh "MATCH (p:Person) RETURN p" test_graph
```

### 6. Create Test Graph

The `create-test-graph.sql` script creates a test graph with sample data for Apache AGE.

**Usage:**
```bash
./scripts/run-sql-file.sh scripts/create-test-graph.sql
```

### 7. Fix AGE Permissions

The `fix-age-permissions.sh` script fixes permissions for the Apache AGE extension.

**Usage:**
```bash
./scripts/fix-age-permissions.sh
```

### 8. Check AGE Status

The `check-age-status.sql` script checks the status of the Apache AGE extension.

**Usage:**
```bash
./scripts/run-sql-file.sh scripts/check-age-status.sql
```

## Example SQL Files

- `basic-test.sql`: A simple test file that checks PostgreSQL version and AGE extension.
- `list-age-graphs.sql`: Lists all Apache AGE graphs in the database.
- `graph-details.sql`: Shows detailed information about a specific graph.
- `create-test-graph.sql`: Creates a test graph with sample data for Apache AGE.
- `check-age-status.sql`: Checks the status of the Apache AGE extension.
- `fix-age-permissions.sql`: Fixes permissions for the Apache AGE extension.
- `setup_age_db.sql`: Script to set up the AGE extension and create a test graph.
- `test_age_user.sql`: Script to test the AGE user permissions.

## Environment Variables

These scripts use the following environment variables from `.env.test`:

- `PGHOST`: PostgreSQL host (default: localhost)
- `PGPORT`: PostgreSQL port (default: 5432)
- `PGDATABASE`: PostgreSQL database name (default: age-integration)
- `PGUSER`: PostgreSQL username (default: age)
- `PGPASSWORD`: PostgreSQL password (default: agepassword)

## Troubleshooting

If you encounter permission issues, make sure the scripts are executable:

```bash
chmod +x scripts/run-sql-command.sh scripts/run-sql-file.sh
```

If you get connection errors, verify that the database settings in `.env.test` are correct and that the PostgreSQL server is running.
