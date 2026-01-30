#!/bin/bash
# Fix TS6133 unused variable errors by prefixing with underscore

# Get all files with TS6133 errors
npm run type-check 2>&1 | grep "TS6133" | sed 's/(.*:.*):.*$/\1/' | sort -u > /tmp/ts6133_files.txt

echo "Found files with TS6133 errors:"
cat /tmp/ts6133_files.txt

