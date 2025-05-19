#!/bin/bash

# Script to install the batch loader functions in the PostgreSQL database
# This script uses the environment variables from .env.test by default

# Load environment variables from .env.test if not specified
ENV_FILE=${1:-".env.test"}
if [ -f "$ENV_FILE" ]; then
  echo "Loading environment variables from $ENV_FILE"
  export $(grep -v '^#' "$ENV_FILE" | xargs)
else
  echo "Environment file $ENV_FILE not found"
  exit 1
fi

# Check if required environment variables are set
if [ -z "$PGHOST" ] || [ -z "$PGPORT" ] || [ -z "$PGDATABASE" ] || [ -z "$PGUSER" ]; then
  echo "Required environment variables are not set"
  echo "Please set PGHOST, PGPORT, PGDATABASE, and PGUSER"
  exit 1
fi

# Install the functions
echo "Installing batch loader functions in $PGDATABASE on $PGHOST:$PGPORT"
export PGPASSWORD="$PGPASSWORD"
psql -h "$PGHOST" -p "$PGPORT" -d "$PGDATABASE" -U "$PGUSER" -f sql/batch-loader-functions.sql

# Check if the installation was successful
if [ $? -eq 0 ]; then
  echo "Batch loader functions installed successfully"
else
  echo "Failed to install batch loader functions"
  exit 1
fi

# Verify that the functions exist
echo "Verifying that the functions exist"
psql -h "$PGHOST" -p "$PGPORT" -d "$PGDATABASE" -U "$PGUSER" -c "SELECT proname, pronamespace::regnamespace FROM pg_proc WHERE proname IN ('get_vertices', 'get_edges') AND pronamespace::regnamespace = 'age_schema_client'::regnamespace;"

# Check if the verification was successful
if [ $? -eq 0 ]; then
  echo "Functions verified successfully"
else
  echo "Failed to verify functions"
  exit 1
fi

echo "Installation complete"
