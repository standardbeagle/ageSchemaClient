# Documentation Guidelines

This guide provides detailed procedures for updating, maintaining, and improving the Apache AGE Schema Client documentation.

## When to Update Documentation

### Code Changes That Require Documentation Updates

- **New features**: Any new public API, method, or functionality
- **Breaking changes**: Changes that affect existing user code
- **Configuration changes**: New options, environment variables, or setup requirements
- **Error handling**: New error types or changed error messages
- **Performance improvements**: Significant performance changes users should know about
- **Security updates**: Security-related changes or recommendations

### Documentation-Only Updates

- **Clarifications**: Improving unclear explanations or instructions
- **Examples**: Adding new examples or improving existing ones
- **Corrections**: Fixing errors, typos, or outdated information
- **Organization**: Restructuring content for better navigation
- **Accessibility**: Improving readability and accessibility

## Documentation Update Process

### 1. Planning Your Update

Before making changes:

1. **Identify the scope**: What documentation needs to be updated?
2. **Check dependencies**: Will this affect other documentation pages?
3. **Review existing content**: Understand the current structure and style
4. **Plan the changes**: Outline what you'll add, modify, or remove

### 2. Making Changes

#### For Code-Related Updates

1. **Update TypeScript comments** first (for API documentation)
2. **Update manual documentation** in relevant `.md` files
3. **Add or update examples** in the `examples/` directory
4. **Update integration tests** if examples change

#### For Documentation-Only Updates

1. **Edit the relevant markdown files** directly
2. **Update cross-references** if you change headings or file names
3. **Test all links** to ensure they still work
4. **Check formatting** using the local preview

### 3. Testing Your Changes

Always test documentation changes locally:

```bash
# Start the documentation server
cd website
pnpm start

# In another terminal, generate API docs if needed
pnpm docs:api

# For full build test
pnpm docs:build
```

#### What to Test

- **Navigation**: Can users find your new content?
- **Links**: Do all internal and external links work?
- **Code examples**: Do all code examples run without errors?
- **Mobile view**: Does the content display well on mobile devices?
- **Search**: Can users find your content through search?

### 4. Review Process

#### Self-Review Checklist

Before submitting your changes:

- [ ] Content follows the [Style Guide](./style-guide.md)
- [ ] All code examples are tested and working
- [ ] Links are functional and point to correct locations
- [ ] Spelling and grammar are correct
- [ ] Content is accessible and inclusive
- [ ] Changes are consistent with existing documentation

#### Peer Review

For significant changes, request review from:
- **Technical accuracy**: Someone familiar with the code
- **Writing quality**: Someone who can review for clarity and style
- **User perspective**: Someone who represents the target audience

## Content Types and Guidelines

### API Documentation

#### TypeScript Comments (Primary Source)

API documentation is primarily generated from TypeScript comments. Follow JSDoc standards:

```typescript
/**
 * Creates a new vertex in the graph with the specified label and properties.
 * 
 * @param label - The vertex label as defined in your schema
 * @param properties - The vertex properties matching the schema definition
 * @returns Promise that resolves to the created vertex with generated ID
 * 
 * @throws {ValidationError} When properties don't match the schema
 * @throws {DatabaseError} When the database operation fails
 * 
 * @example
 * ```typescript
 * const person = await vertexOperations.createVertex('Person', {
 *   name: 'Alice Smith',
 *   age: 30,
 *   email: 'alice@example.com'
 * });
 * ```
 * 
 * @since 0.1.0
 */
async createVertex<T extends VertexLabel>(
  label: T,
  properties: VertexProperties<T>
): Promise<Vertex<T>> {
  // Implementation...
}
```

#### Manual API Documentation

Supplement TypeDoc with manual documentation in `docs/api-reference.md` for:
- **Overview and concepts**: High-level explanations
- **Usage patterns**: Common ways to use the API
- **Integration examples**: How different parts work together
- **Migration guides**: Upgrading between versions

### How-To Guides

How-to guides should be:
- **Task-oriented**: Focus on accomplishing specific goals
- **Step-by-step**: Clear, sequential instructions
- **Practical**: Use realistic examples and scenarios
- **Complete**: Include setup, execution, and cleanup

#### Structure Template

```markdown
# How to [Accomplish Specific Task]

Brief description of what this guide covers and when to use it.

## Prerequisites

- Requirement 1
- Requirement 2
- Requirement 3

## Step 1: [Action]

Explanation of what this step does and why.

```typescript
// Code example with comments
const example = 'working code';
```

## Step 2: [Action]

Continue with clear steps...

## Troubleshooting

Common issues and solutions.

## Next Steps

What to do after completing this guide.
```

### Troubleshooting Documentation

#### Problem-Solution Format

```markdown
### Problem: [Clear description of the issue]

**Symptoms:**
- What the user sees or experiences
- Error messages or unexpected behavior

**Cause:**
Why this problem occurs.

**Solution:**
Step-by-step resolution.

**Prevention:**
How to avoid this issue in the future.
```

#### Common Issues Section

Maintain a section for frequently encountered problems:

1. **Connection issues**: Database connectivity problems
2. **Schema validation errors**: Common validation failures
3. **Performance problems**: Slow queries or operations
4. **Configuration issues**: Setup and configuration problems

### Architecture Documentation

#### Purpose and Audience

Architecture documentation should:
- **Explain design decisions**: Why things are built this way
- **Show relationships**: How components interact
- **Guide contributors**: Help developers understand the codebase
- **Document constraints**: Technical limitations and trade-offs

#### Content Structure

```markdown
# [Component/System Name]

## Overview
High-level description and purpose.

## Architecture
System design with diagrams.

## Components
Detailed component descriptions.

## Data Flow
How data moves through the system.

## Design Decisions
Key architectural choices and rationale.

## Constraints and Limitations
Technical constraints and known limitations.

## Future Considerations
Planned improvements or known issues.
```

## Version Management

### Documentation Versioning

- **Major versions**: Significant API changes or restructuring
- **Minor versions**: New features or substantial content additions
- **Patch versions**: Bug fixes, clarifications, or small improvements

### Changelog Maintenance

Update `changelog.md` for documentation changes:

```markdown
## [0.3.1] - 2024-01-15

### Documentation
- Added troubleshooting guide for connection issues
- Improved batch loading examples
- Fixed broken links in API reference
- Updated installation instructions for Node.js 18+
```

### Deprecation Process

When deprecating documentation:

1. **Mark as deprecated**: Add deprecation notice to the content
2. **Provide alternatives**: Show users what to use instead
3. **Set removal timeline**: When the content will be removed
4. **Update cross-references**: Remove links from other documentation

```markdown
> ⚠️ **Deprecated**: This method is deprecated as of v0.3.0 and will be removed in v1.0.0. Use [`newMethod()`](./new-method.md) instead.
```

## Integration with Development Workflow

### Documentation in Pull Requests

#### When to Include Documentation

- **New features**: Always include documentation updates
- **Bug fixes**: Update documentation if the fix changes behavior
- **Refactoring**: Update if public interfaces change
- **Performance improvements**: Document significant improvements

#### PR Documentation Checklist

- [ ] All new public APIs are documented
- [ ] Examples are updated if behavior changes
- [ ] Breaking changes are clearly documented
- [ ] Migration guides are provided for breaking changes
- [ ] Changelog is updated

### Continuous Integration

Documentation should be tested in CI:

```yaml
# Example CI step for documentation
- name: Test Documentation Build
  run: |
    cd website
    pnpm install
    pnpm build
    
- name: Check Links
  run: |
    # Link checking tool
    markdown-link-check docs/**/*.md
```

## Content Maintenance

### Regular Review Schedule

- **Monthly**: Review and update getting started guides
- **Quarterly**: Check all external links and references
- **Per release**: Update version-specific information
- **Annually**: Comprehensive review of all documentation

### Content Auditing

#### What to Check

1. **Accuracy**: Is the information still correct?
2. **Completeness**: Are there gaps in coverage?
3. **Relevance**: Is the content still useful?
4. **Quality**: Does it meet our style standards?
5. **Performance**: Are examples still efficient?

#### Tools for Auditing

- **Link checkers**: Automated link validation
- **Spell checkers**: Catch typos and errors
- **Analytics**: Identify popular and unused content
- **User feedback**: Issues and support requests

### User Feedback Integration

#### Collecting Feedback

- **GitHub issues**: Documentation improvement requests
- **User surveys**: Periodic documentation satisfaction surveys
- **Support channels**: Common questions indicate documentation gaps
- **Analytics**: Page views and user behavior

#### Acting on Feedback

1. **Prioritize**: Focus on high-impact improvements
2. **Plan**: Include documentation improvements in sprint planning
3. **Implement**: Make changes following this guide
4. **Follow up**: Verify that changes address the feedback

## Collaboration Guidelines

### Working with Multiple Contributors

#### Avoiding Conflicts

- **Communicate**: Discuss major changes before starting
- **Coordinate**: Use issues to track documentation work
- **Review**: Always have someone else review your changes
- **Merge carefully**: Resolve conflicts thoughtfully

#### Style Consistency

- **Follow the style guide**: Maintain consistent voice and formatting
- **Use templates**: Start with provided templates
- **Reference examples**: Look at existing documentation for patterns
- **Ask questions**: When in doubt, ask for clarification

### Cross-Team Collaboration

#### With Development Team

- **Early involvement**: Include documentation in feature planning
- **Regular sync**: Review documentation needs in team meetings
- **Code review**: Include documentation review in code review process
- **Release planning**: Coordinate documentation with release schedules

#### With Design Team

- **User experience**: Ensure documentation supports good UX
- **Visual consistency**: Maintain consistent visual design
- **Accessibility**: Follow accessibility guidelines
- **Information architecture**: Organize content logically

## Tools and Automation

### Recommended Tools

#### Writing and Editing

- **VS Code**: With markdown extensions for editing
- **Grammarly**: For grammar and style checking
- **Hemingway Editor**: For readability improvement
- **Markdown linters**: For consistent formatting

#### Testing and Validation

- **markdown-link-check**: Automated link validation
- **textlint**: Automated style guide enforcement
- **Lighthouse**: Accessibility and performance testing
- **Browser testing**: Cross-browser compatibility

### Automation Opportunities

#### What to Automate

- **Link checking**: Regular validation of all links
- **Spell checking**: Automated typo detection
- **Style enforcement**: Consistent formatting and style
- **Build testing**: Ensure documentation builds successfully

#### What to Keep Manual

- **Content quality**: Human judgment for clarity and usefulness
- **Technical accuracy**: Expert review of technical content
- **User experience**: Human testing of user workflows
- **Creative decisions**: Style and tone choices

This guide provides the framework for maintaining high-quality documentation. Remember that good documentation is an ongoing effort that requires attention and care from the entire team.
