#!/bin/bash

# ============================================================================
# OUTLET SCHEMA MIGRATION SCRIPT
# ============================================================================
# This script migrates outlet data from the old schema (single check_in_time,
# check_out_time, salary per outlet) to the new schema (multiple settings
# per outlet in outlet_settings table).
#
# OLD SCHEMA:
#   - outlets table has: check_in_time, check_out_time, salary, pic_phone
#
# NEW SCHEMA:
#   - outlets table removed: check_in_time, check_out_time, salary, pic_phone
#   - outlet_settings table added with: outlet_id, check_in_time, check_out_time, salary, day[]
#
# MIGRATION STRATEGY:
#   1. Backup existing data
#   2. Create temporary migration table
#   3. Copy old outlet data to migration table
#   4. Drop old columns from outlets table
#   5. Create outlet_settings table
#   6. Migrate data from migration table to outlet_settings
#   7. Clean up migration table
# ============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Database connection from .env
if [ -f .env ]; then
    export $(cat .env | grep ADAPTER_PRISMA_POSTGRES_URL | xargs)
else
    echo -e "${RED}Error: .env file not found${NC}"
    exit 1
fi

DB_URL=$ADAPTER_PRISMA_POSTGRES_URL

echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}OUTLET SCHEMA MIGRATION - OLD TO NEW${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""

# Step 1: Backup existing data
echo -e "${YELLOW}[1/7] Creating backup of outlets table...${NC}"
psql $DB_URL -c "
CREATE TABLE IF NOT EXISTS outlets_backup_$(date +%Y%m%d_%H%M%S) AS 
SELECT * FROM outlets;
" || {
    echo -e "${RED}Failed to create backup${NC}"
    exit 1
}
echo -e "${GREEN}✓ Backup created successfully${NC}"
echo ""

# Step 2: Create temporary migration table
echo -e "${YELLOW}[2/7] Creating temporary migration table...${NC}"
psql $DB_URL -c "
CREATE TEMP TABLE outlet_migration AS
SELECT 
    id,
    check_in_time,
    check_out_time,
    salary,
    pic_phone
FROM outlets
WHERE check_in_time IS NOT NULL 
   OR check_out_time IS NOT NULL 
   OR salary IS NOT NULL;
" || {
    echo -e "${RED}Failed to create migration table${NC}"
    exit 1
}

# Count records to migrate
RECORD_COUNT=$(psql $DB_URL -t -c "SELECT COUNT(*) FROM outlet_migration;")
echo -e "${GREEN}✓ Migration table created with ${RECORD_COUNT} records${NC}"
echo ""

# Step 3: Show what will be migrated
echo -e "${YELLOW}[3/7] Preview of data to be migrated:${NC}"
psql $DB_URL -c "
SELECT 
    id as outlet_id,
    check_in_time,
    check_out_time,
    salary
FROM outlet_migration
LIMIT 5;
"
echo ""

# Step 4: Ask for confirmation
read -p "$(echo -e ${YELLOW}Continue with migration? [y/N]:${NC} )" -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Migration cancelled${NC}"
    exit 1
fi
echo ""

# Step 5: Run Prisma migration to update schema
echo -e "${YELLOW}[4/7] Running Prisma schema migration...${NC}"
npx prisma migrate dev --name migrate_outlet_to_settings || {
    echo -e "${RED}Failed to run Prisma migration${NC}"
    echo -e "${YELLOW}You may need to manually update the schema${NC}"
    exit 1
}
echo -e "${GREEN}✓ Schema updated successfully${NC}"
echo ""

# Step 6: Migrate data to outlet_settings table
echo -e "${YELLOW}[5/7] Migrating data to outlet_settings table...${NC}"
psql $DB_URL -c "
INSERT INTO outlet_settings (outlet_id, check_in_time, check_out_time, salary, day, \"createdAt\", \"updatedAt\")
SELECT 
    id as outlet_id,
    check_in_time,
    check_out_time,
    salary,
    ARRAY['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']::\"DAY\"[] as day,
    NOW() as \"createdAt\",
    NOW() as \"updatedAt\"
FROM outlet_migration
WHERE check_in_time IS NOT NULL 
  AND check_out_time IS NOT NULL 
  AND salary IS NOT NULL;
" || {
    echo -e "${RED}Failed to migrate data to outlet_settings${NC}"
    exit 1
}

MIGRATED_COUNT=$(psql $DB_URL -t -c "SELECT COUNT(*) FROM outlet_settings;")
echo -e "${GREEN}✓ Successfully migrated ${MIGRATED_COUNT} outlet settings${NC}"
echo ""

# Step 7: Verify migration
echo -e "${YELLOW}[6/7] Verifying migration...${NC}"
echo "Outlets with settings:"
psql $DB_URL -c "
SELECT 
    o.id,
    o.name,
    COUNT(os.id) as settings_count
FROM outlets o
LEFT JOIN outlet_settings os ON os.outlet_id = o.id
GROUP BY o.id, o.name
ORDER BY o.id
LIMIT 10;
"
echo ""

# Step 8: Show sample migrated data
echo -e "${YELLOW}[7/7] Sample of migrated settings:${NC}"
psql $DB_URL -c "
SELECT 
    os.id,
    os.outlet_id,
    o.name as outlet_name,
    os.check_in_time,
    os.check_out_time,
    os.salary,
    os.day
FROM outlet_settings os
JOIN outlets o ON o.id = os.outlet_id
LIMIT 5;
"
echo ""

echo -e "${GREEN}============================================================================${NC}"
echo -e "${GREEN}MIGRATION COMPLETED SUCCESSFULLY!${NC}"
echo -e "${GREEN}============================================================================${NC}"
echo ""
echo -e "${BLUE}Summary:${NC}"
echo -e "  • Backed up outlets table"
echo -e "  • Migrated ${MIGRATED_COUNT} outlet settings"
echo -e "  • All weekday settings (Mon-Fri) created by default"
echo -e "  • Original data preserved in backup table"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "  1. Verify the data in outlet_settings table"
echo -e "  2. Update any additional settings via API if needed"
echo -e "  3. Test the application thoroughly"
echo -e "  4. If everything works, you can drop the backup table later"
echo ""
echo -e "${BLUE}Backup table name: outlets_backup_$(date +%Y%m%d_%H%M%S)${NC}"
echo ""
