-- Create age user with a simple password
CREATE USER age WITH PASSWORD 'agepassword';

-- Create age-integration database
CREATE DATABASE "age-integration";

-- Grant privileges to age user on the new database
GRANT ALL PRIVILEGES ON DATABASE "age-integration" TO age;

-- Connect to the age-integration database
\c age-integration

-- Check if AGE extension exists
SELECT * FROM pg_available_extensions WHERE name = 'age';

-- Install AGE extension if available
CREATE EXTENSION IF NOT EXISTS age;

-- Verify AGE extension is installed
\dx age
