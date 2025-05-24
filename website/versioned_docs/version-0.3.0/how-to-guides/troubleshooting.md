# Troubleshooting

Common issues and solutions when working with ageSchemaClient.

## Connection Issues

### Apache AGE Extension Not Found

**Problem:** Error message about AGE extension not being available.

**Solution:**
1. Ensure Apache AGE is installed
2. Create the extension: `CREATE EXTENSION IF NOT EXISTS age;`
3. Load the extension: `LOAD 'age';`

### Connection Refused

**Problem:** Cannot connect to PostgreSQL database.

**Solution:**
1. Verify PostgreSQL is running
2. Check host, port, and credentials
3. Ensure database exists
4. Check firewall settings

## Query Issues

### Parameter Handling

**Problem:** Dynamic parameters not working in Cypher queries.

**Solution:** Use the parameter management system:

```typescript
query
  .match('(p:Person)')
  .where('p.name = $name')
  .setParam('name', 'Alice')
```

### Performance Issues

**Problem:** Slow query execution.

**Solutions:**
1. Create appropriate indexes
2. Use LIMIT clauses
3. Optimize query patterns
4. Use batch operations for large datasets

## Schema Validation

### Validation Errors

**Problem:** Schema validation failures.

**Solution:**
1. Check data types match schema
2. Verify required fields are present
3. Validate property constraints

## Getting Help

- [GitHub Issues](https://github.com/standardbeagle/ageSchemaClient/issues)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/apache-age)
- [Apache AGE Documentation](https://age.apache.org/)
