---
title: Contributing to Documentation
description: Guide for contributing to Apache AGE Schema Client documentation
---

# Contributing to Apache AGE Schema Client Documentation

Welcome to the Apache AGE Schema Client documentation contribution guide! This guide will help you understand how to contribute to, maintain, and improve our documentation.

## Quick Start

1. **Read the [Style Guide](./style-guide.md)** - Understand our documentation standards
2. **Choose a template** from [`templates/`](./templates/) for your content type
3. **Follow the [Documentation Guidelines](./documentation-guidelines.md)** for updating content
4. **Test locally** using the [Build and Deployment Guide](./build-deployment.md)
5. **Submit for review** following our [Quality Assurance Checklist](./quality-assurance.md)

## Documentation Structure

Our documentation is organized into several key areas:

```
docs/
├── README.md                    # Main documentation entry point
├── getting-started.md           # Installation and quick start
├── api-reference.md            # Manual API documentation
├── architecture/               # System design documentation
├── contributing/               # This directory - contribution guidelines
└── [feature-specific].md       # Individual feature documentation

website/
├── docs/                       # Docusaurus documentation source
│   ├── api-generated/          # Auto-generated TypeDoc API docs
│   ├── getting-started/        # Getting started guides
│   ├── how-to-guides/         # Practical implementation guides
│   └── patterns/              # Common relationship patterns
└── blog/                      # Blog posts and announcements
```

## Types of Documentation

### 1. API Documentation
- **Auto-generated**: TypeDoc generates API docs from TypeScript comments
- **Manual**: Supplementary API documentation in `docs/api-reference.md`
- **Template**: Use [`templates/api-method-template.md`](./templates/api-method-template.md)

### 2. How-To Guides
- **Purpose**: Practical, step-by-step instructions
- **Location**: `website/docs/how-to-guides/`
- **Template**: Use [`templates/how-to-guide-template.md`](./templates/how-to-guide-template.md)

### 3. Troubleshooting Articles
- **Purpose**: Common problems and solutions
- **Location**: Individual files or sections within feature docs
- **Template**: Use [`templates/troubleshooting-template.md`](./templates/troubleshooting-template.md)

### 4. Architecture Documentation
- **Purpose**: System design and technical decisions
- **Location**: `docs/architecture/`
- **Style**: Technical, detailed, with diagrams

## Documentation Workflow

### For New Contributors

1. **Fork the repository** and create a feature branch
2. **Read existing documentation** to understand the current style and structure
3. **Choose the appropriate template** for your content type
4. **Write your documentation** following our [Style Guide](./style-guide.md)
5. **Test locally** using `pnpm docs:start`
6. **Submit a pull request** with a clear description of your changes

### For Maintainers

1. **Review contributions** using our [Quality Assurance Checklist](./quality-assurance.md)
2. **Update documentation** when code changes affect existing docs
3. **Maintain templates** and guidelines as the project evolves
4. **Monitor documentation quality** and user feedback

## Key Principles

### 1. User-Centered
- Write for your audience (developers using Apache AGE)
- Provide practical, actionable information
- Include working code examples
- Address common use cases and pain points

### 2. Consistent
- Follow the established [Style Guide](./style-guide.md)
- Use consistent terminology throughout
- Maintain uniform formatting and structure
- Reference existing patterns and examples

### 3. Maintainable
- Keep documentation close to the code it describes
- Use automation where possible (TypeDoc, link checking)
- Write clear, scannable content
- Update documentation with code changes

### 4. Accessible
- Use clear, simple language
- Provide multiple learning paths (quick start, detailed guides)
- Include visual aids (diagrams, screenshots)
- Test with different skill levels

## Getting Help

- **Questions about documentation**: Open an issue with the `documentation` label
- **Style guide clarifications**: Reference existing examples or ask in discussions
- **Technical writing help**: Check our [Style Guide](./style-guide.md) or existing documentation
- **Build issues**: See [Build and Deployment Guide](./build-deployment.md)

## Related Resources

- [Documentation Guidelines](./documentation-guidelines.md) - Detailed update procedures
- [Style Guide](./style-guide.md) - Writing and formatting standards
- [Build and Deployment](./build-deployment.md) - Technical setup and deployment
- [Version Management](./version-management.md) - Versioning and release documentation
- [Quality Assurance](./quality-assurance.md) - Review checklist and testing

## Recognition

We appreciate all contributions to our documentation! Contributors will be:
- Listed in our changelog for documentation improvements
- Mentioned in release notes for significant contributions
- Invited to join our documentation review team for ongoing contributors

Thank you for helping make Apache AGE Schema Client documentation better for everyone!
