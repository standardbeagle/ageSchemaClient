# Changelog

## [Unreleased]

### Added
- **Documentation Versioning System**: Complete Docusaurus versioning implementation
  - Docusaurus 3.7.0 versioning configuration with version dropdown in navbar
  - Initial version 0.3.0 created with full documentation snapshot
  - Version-specific routing: latest at `/docs/`, next at `/docs/next/`
  - Versioned docs stored in `website/versioned_docs/version-X.X.X/`
  - Versioned sidebars in `website/versioned_sidebars/`
  - Version management scripts: `pnpm docs:version X.X.X`, `pnpm docs:version:list`
  - Comprehensive versioning documentation and guides for maintainers
  - Automated testing scripts for versioning system validation
  - Build system support for multiple documentation versions

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