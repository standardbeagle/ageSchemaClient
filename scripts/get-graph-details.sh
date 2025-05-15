#!/bin/bash

# Script to get detailed information about a specific Apache AGE graph
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

# Check if a graph name was provided
if [ $# -eq 0 ]; then
  echo "Usage: $0 graph_name"
  echo "Example: $0 test_graph"
  exit 1
fi

# Graph name from the first argument
GRAPH_NAME="$1"

# Run the SQL file with the graph name parameter
PGPASSWORD=$PGPASSWORD psql -h $PGHOST -p $PGPORT -d $PGDATABASE -U $PGUSER \
  -v graph_name=$GRAPH_NAME -f scripts/graph-details.sql

# Exit with the status of the psql command
exit $?
