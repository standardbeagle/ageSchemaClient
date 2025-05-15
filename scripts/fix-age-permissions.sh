#!/bin/bash

# Script to fix permissions for the Apache AGE extension
# This script must be run as a user with sudo privileges

# Load environment variables from .env.test
if [ -f .env.test ]; then
  # Read the environment variables manually to avoid issues with export
  PGHOST=$(grep -v '^#' .env.test | grep 'PGHOST' | cut -d '=' -f2)
  PGPORT=$(grep -v '^#' .env.test | grep 'PGPORT' | cut -d '=' -f2)
  PGDATABASE=$(grep -v '^#' .env.test | grep 'PGDATABASE' | cut -d '=' -f2)
  
  # Set defaults if any variable is empty
  PGHOST=${PGHOST:-localhost}
  PGPORT=${PGPORT:-5432}
  PGDATABASE=${PGDATABASE:-age-integration}
else
  echo "Warning: .env.test file not found, using default values"
  PGHOST=localhost
  PGPORT=5432
  PGDATABASE=age-integration
fi

echo "This script will fix permissions for the Apache AGE extension."
echo "You will be prompted for the postgres user password."
echo "Database: $PGDATABASE on $PGHOST:$PGPORT"
echo ""

# Run the SQL file as the postgres superuser
sudo -u postgres psql -d $PGDATABASE -f fix-age-permissions.sql

# Check if the command was successful
if [ $? -eq 0 ]; then
  echo ""
  echo "Permissions have been fixed successfully."
  echo "You may need to reconnect to the database for the changes to take effect."
else
  echo ""
  echo "Error: Failed to fix permissions."
  echo "Make sure you have sudo privileges and the postgres user exists."
fi

# Exit with the status of the psql command
exit $?
