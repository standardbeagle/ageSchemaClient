#!/bin/bash

# Script to run SQL commands directly from the command line
# Uses environment variables from .env.test

# Load environment variables from .env.test
if [ -f .env.test ]; then
  # Read the environment variables manually to avoid issues with export
  PGHOST=$(grep -v '^#' .env.test | grep 'PGHOST' | cut -d '=' -f2)
  PGPORT=$(grep -v '^#' .env.test | grep 'PGPORT' | cut -d '=' -f2)
  PGDATABASE=$(grep -v '^#' .env.test | grep 'PGDATABASE' | cut -d '=' -f2)
  PGUSER=$(grep -v '^#' .env.test | grep 'PGUSER' | cut -d '=' -f2)
  PGPASSWORD=$(grep -v '^#' .env.test | grep 'PGPASSWORD' | cut -d '=' -f2)

  # Set defaults if any variable is empty
  PGHOST=${PGHOST:-localhost}
  PGPORT=${PGPORT:-5432}
  PGDATABASE=${PGDATABASE:-age-integration}
  PGUSER=${PGUSER:-age}
  PGPASSWORD=${PGPASSWORD:-agepassword}
else
  echo "Warning: .env.test file not found, using default values"
  PGHOST=localhost
  PGPORT=5432
  PGDATABASE=age-integration
  PGUSER=age
  PGPASSWORD=agepassword
fi

# Check if a command was provided
if [ $# -eq 0 ]; then
  echo "Usage: $0 \"SQL command\""
  echo "Examples:"
  echo "  $0 \"SELECT * FROM pg_catalog.pg_tables LIMIT 5;\""
  echo ""
  echo "For Apache AGE Cypher queries with dollar quotes ($$), use one of these formats:"
  echo "  $0 \"SELECT * FROM ag_catalog.cypher('test_graph', \\\$\\\$ MATCH (n) RETURN n \\\$\\\$) as (n  ag_catalog.agtype);\""
  echo "  $0 'SELECT * FROM ag_catalog.cypher(\"test_graph\", $$ MATCH (n) RETURN n $$) as (n  ag_catalog.agtype);'"
  echo "  $0 'SELECT * FROM ag_catalog.cypher('\\''test_graph'\\', $$ MATCH (n) RETURN n $$) as (n a ag_catalog.agtype);'"
  exit 1
fi

# SQL command from the first argument
SQL_COMMAND="$1"

# Run the SQL command using psql with environment variables
PGPASSWORD=$PGPASSWORD psql -h $PGHOST -p $PGPORT -d $PGDATABASE -U $PGUSER -c "$SQL_COMMAND"

# Exit with the status of the psql command
exit $?
