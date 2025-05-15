#!/bin/bash

# Script to run Cypher queries on Apache AGE
# Uses environment variables from .env.test

# Load environment variables from .env.test
if [ -f .env.test ]; then
  # Read the environment variables manually to avoid issues with export
  PGHOST=$(grep -v '^#' .env.test | grep 'PGHOST' | cut -d '=' -f2)
  PGPORT=$(grep -v '^#' .env.test | grep 'PGPORT' | cut -d '=' -f2)
  PGDATABASE=$(grep -v '^#' .env.test | grep 'PGDATABASE' | cut -d '=' -f2)
  PGUSER=$(grep -v '^#' .env.test | grep 'PGUSER' | cut -d '=' -f2)
  PGPASSWORD=$(grep -v '^#' .env.test | grep 'PGPASSWORD' | cut -d '=' -f2)
  AGE_GRAPH_NAME=$(grep -v '^#' .env.test | grep 'AGE_GRAPH_NAME' | cut -d '=' -f2)

  # Set defaults if any variable is empty
  PGHOST=${PGHOST:-localhost}
  PGPORT=${PGPORT:-5432}
  PGDATABASE=${PGDATABASE:-age-integration}
  PGUSER=${PGUSER:-age}
  PGPASSWORD=${PGPASSWORD:-agepassword}
  AGE_GRAPH_NAME=${AGE_GRAPH_NAME:-test_graph}
else
  echo "Warning: .env.test file not found, using default values"
  PGHOST=localhost
  PGPORT=5432
  PGDATABASE=age-integration
  PGUSER=age
  PGPASSWORD=agepassword
  AGE_GRAPH_NAME=test_graph
fi

# Check if arguments were provided
if [ $# -lt 1 ]; then
  echo "Usage: $0 \"CYPHER QUERY\" [GRAPH_NAME]"
  echo "Examples:"
  echo "  $0 \"MATCH (n) RETURN n\""
  echo "  $0 \"MATCH (p:Person) RETURN p\" test_graph"
  exit 1
fi

# Cypher query from the first argument
CYPHER_QUERY="$1"

# Graph name from the second argument or default
GRAPH_NAME="${2:-$AGE_GRAPH_NAME}"

# Check if AGE extension is accessible
echo "Checking AGE extension access..."
AGE_CHECK=$(PGPASSWORD=$PGPASSWORD psql -h $PGHOST -p $PGPORT -d $PGDATABASE -U $PGUSER -t -c "SELECT COUNT(*) FROM pg_extension WHERE extname = 'age';")
AGE_CHECK=$(echo $AGE_CHECK | tr -d ' ')

if [ "$AGE_CHECK" -eq "0" ]; then
  echo "Error: AGE extension is not installed in the database."
  echo "Please install the AGE extension with: CREATE EXTENSION age;"
  exit 1
fi

# Construct the SQL command with proper quoting
# Use the fully qualified name and specify the return type as in the tests
# For simplicity, always use the generic return type
SQL_COMMAND="LOAD 'age'; SELECT * FROM ag_catalog.cypher('$GRAPH_NAME', \$\$ $CYPHER_QUERY \$\$) as (result ag_catalog.agtype);"

# Note: For complex queries with specific return columns, you should use a SQL file
# with the appropriate return type specification, for example:
# SELECT * FROM ag_catalog.cypher('test_graph', $$
#   MATCH (p:Person)-[r:WORKS_IN]->(d:Department)
#   RETURN p.name AS name, d.name AS department, r.role AS role
# $$) as (name text, department text, role text);

# Print the command for debugging
echo "Executing SQL command:"
echo "$SQL_COMMAND"
echo ""

# First check if the graph exists
echo "Checking if graph '$GRAPH_NAME' exists..."
GRAPH_CHECK=$(PGPASSWORD=$PGPASSWORD psql -h $PGHOST -p $PGPORT -d $PGDATABASE -U $PGUSER -t -c "SELECT COUNT(*) FROM ag_catalog.ag_graph WHERE name = '$GRAPH_NAME';")
GRAPH_CHECK=$(echo $GRAPH_CHECK | tr -d ' ')

if [ "$GRAPH_CHECK" -eq "0" ]; then
  echo "Error: Graph '$GRAPH_NAME' does not exist."
  echo "Available graphs:"
  PGPASSWORD=$PGPASSWORD psql -h $PGHOST -p $PGPORT -d $PGDATABASE -U $PGUSER -c "SELECT name FROM ag_catalog.ag_graph;"
  exit 1
fi

# Create a temporary SQL file to avoid quoting issues
TEMP_SQL_FILE=$(mktemp)
echo "$SQL_COMMAND" > $TEMP_SQL_FILE

# Run the SQL command using psql with environment variables
echo "Running Cypher query..."
RESULT=$(PGPASSWORD=$PGPASSWORD psql -h $PGHOST -p $PGPORT -d $PGDATABASE -U $PGUSER -f "$TEMP_SQL_FILE" 2>&1)
EXIT_CODE=$?

# Remove the temporary file
rm -f "$TEMP_SQL_FILE"

# Check for specific errors
if [[ $RESULT == *"access to library \"age\" is not allowed"* ]]; then
  echo ""
  echo "Error: Access to the AGE library is not allowed."
  echo "This is a permissions issue. To fix it, run:"
  echo "  ./scripts/fix-age-permissions.sh"
  echo ""
  echo "For more information about the AGE extension status, run:"
  echo "  ./scripts/run-sql-file.sh scripts/check-age-status.sql"
  exit 1
elif [[ $EXIT_CODE -ne 0 ]]; then
  echo ""
  echo "Error executing Cypher query. Output:"
  echo "$RESULT"
  exit $EXIT_CODE
else
  echo "$RESULT"
fi

# Exit with success
exit 0
