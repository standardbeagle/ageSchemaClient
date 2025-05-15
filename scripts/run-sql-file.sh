#!/bin/bash

# Script to run SQL commands from a file
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

# Check if a file was provided
if [ $# -eq 0 ]; then
  echo "Usage: $0 path/to/sql/file.sql"
  echo "Example: $0 setup_age_db.sql"
  exit 1
fi

# SQL file from the first argument
SQL_FILE="$1"

# Check if the file exists
if [ ! -f "$SQL_FILE" ]; then
  echo "Error: SQL file '$SQL_FILE' not found"
  exit 1
fi

# Run the SQL file using psql with environment variables
PGPASSWORD=$PGPASSWORD psql -h $PGHOST -p $PGPORT -d $PGDATABASE -U $PGUSER -f "$SQL_FILE"

# Exit with the status of the psql command
exit $?
