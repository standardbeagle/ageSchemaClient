# Changelog

## [Unreleased]

### Added
- **Extension System**: Added pluggable extension system for PostgreSQL extensions
  - New `ExtensionInitializer` interface for creating custom extension initializers
  - Built-in initializers for Apache AGE, pgvector, PostGIS, and search path management
  - `AgeExtensionInitializer`: Handles AGE extension loading and setup (default behavior)
  - `PgVectorExtensionInitializer`: Initializes pgvector extension for vector similarity search
  - `PostGISExtensionInitializer`: Initializes PostGIS extension for spatial data support
  - `SearchPathInitializer`: Adds additional schemas to PostgreSQL search path
  - Support for custom extension initializers with `initialize()` and optional `cleanup()` methods
  - Extension cleanup on connection release to maintain clean state
  - Backward compatibility: existing code continues to work without changes

### Changed
- Connection pool now uses extension system for initialization instead of hardcoded AGE setup
- Extension initialization happens on pool 'connect' event for better performance
- Extension cleanup happens on connection release for proper state management

### Technical Details
- Added `extensions` property to `ConnectionConfig` interface
- Modified `PgConnectionManager` to use extension system
- Moved AGE-specific initialization logic to `AgeExtensionInitializer`
- Added comprehensive integration tests for extension system
- Added documentation and examples for extension usage

### Migration Guide
No migration required - the extension system is fully backward compatible. Existing code will continue to work as before with the default AGE extension initializer.