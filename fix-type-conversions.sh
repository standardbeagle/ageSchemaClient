#!/bin/bash

# Fix type conversion issues in algorithms.ts
sed -i 's/as AlgorithmQueryBuilder<T>/as unknown as AlgorithmQueryBuilder<T>/g' src/query/algorithms.ts

# Fix type conversion issues in analytics.ts
sed -i 's/as AnalyticsQueryBuilder<T>/as unknown as AnalyticsQueryBuilder<T>/g' src/query/analytics.ts

echo "Type conversion issues fixed!"
