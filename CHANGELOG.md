# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Removed
- **BREAKING CHANGE**: Removed `AgeSchemaClient` facade class with unimplemented functionality
- Removed broken client.ts file and associated tests

### Added
- Implemented missing parameter collection functionality in query parts
- Added comprehensive test suite for parameter collection (7 test cases)
- Enhanced main exports to clearly expose individual working components

### Changed
- **BREAKING CHANGE**: Library now exports individual components instead of monolithic client
- Updated README.md with new component-based usage examples
- Updated examples/basic-usage.ts to demonstrate component composition
- Restructured main exports to focus on core working components:
  - Connection Pool Management (`PgConnectionManager`)
  - Query Building (`QueryBuilder`, `PathQueryBuilder`, etc.)
  - SQL Generation (`SQLGenerator`)
  - Schema Management (schema loading and validation)
  - Batch Operations (`SchemaLoader`)

### Fixed
- Completed TODO in `src/query/parts.ts` for parameter collection from patterns
- Fixed TypeScript linting errors
- Updated all tests to remove broken AgeSchemaClient references

## [0.5.0] - Previous Release
- Query builder validation and convenience methods
- TypeScript build error fixes
- Schema-qualified function call exclusions