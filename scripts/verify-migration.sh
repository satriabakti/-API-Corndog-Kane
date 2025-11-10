#!/bin/bash

# ============================================================================
# MIGRATION VERIFICATION SCRIPT
# ============================================================================
# This script verifies that the outlet migration was successful
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Load database URL
if [ -f .env ]; then
    export $(cat .env | grep ADAPTER_PRISMA_POSTGRES_URL | xargs)
else
    echo -e "${RED}Error: .env file not found${NC}"
    exit 1
fi

DB_URL=$ADAPTER_PRISMA_POSTGRES_URL

echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}MIGRATION VERIFICATION REPORT${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""

# Check 1: Count outlets
echo -e "${YELLOW}[1] Total Outlets:${NC}"
TOTAL_OUTLETS=$(psql $DB_URL -t -c "SELECT COUNT(*) FROM outlets;")
echo -e "    ${GREEN}${TOTAL_OUTLETS} outlets found${NC}"
echo ""

# Check 2: Count outlet settings
echo -e "${YELLOW}[2] Total Outlet Settings:${NC}"
TOTAL_SETTINGS=$(psql $DB_URL -t -c "SELECT COUNT(*) FROM outlet_settings;")
echo -e "    ${GREEN}${TOTAL_SETTINGS} settings found${NC}"
echo ""

# Check 3: Outlets without settings
echo -e "${YELLOW}[3] Outlets Without Settings:${NC}"
psql $DB_URL -c "
SELECT 
    o.id,
    o.name,
    o.code,
    o.is_active
FROM outlets o
LEFT JOIN outlet_settings os ON os.outlet_id = o.id
WHERE os.id IS NULL;
"

NO_SETTINGS=$(psql $DB_URL -t -c "
SELECT COUNT(*) 
FROM outlets o
LEFT JOIN outlet_settings os ON os.outlet_id = o.id
WHERE os.id IS NULL;
")

if [ "$NO_SETTINGS" -eq 0 ]; then
    echo -e "${GREEN}✓ All outlets have settings${NC}"
else
    echo -e "${RED}⚠ Warning: ${NO_SETTINGS} outlets have no settings${NC}"
fi
echo ""

# Check 4: Settings distribution
echo -e "${YELLOW}[4] Settings Distribution per Outlet:${NC}"
psql $DB_URL -c "
SELECT 
    COUNT(os.id) as settings_count,
    COUNT(DISTINCT o.id) as outlet_count
FROM outlets o
LEFT JOIN outlet_settings os ON os.outlet_id = o.id
GROUP BY os.outlet_id
HAVING COUNT(os.id) > 0
ORDER BY settings_count DESC;
"
echo ""

# Check 5: Sample outlet with settings
echo -e "${YELLOW}[5] Sample Outlet with Settings:${NC}"
psql $DB_URL -c "
SELECT 
    o.id as outlet_id,
    o.name as outlet_name,
    os.id as setting_id,
    os.check_in_time,
    os.check_out_time,
    os.salary,
    os.day
FROM outlets o
JOIN outlet_settings os ON os.outlet_id = o.id
ORDER BY o.id, os.id
LIMIT 10;
"
echo ""

# Check 6: Verify backup exists
echo -e "${YELLOW}[6] Backup Tables:${NC}"
psql $DB_URL -c "
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE tablename LIKE 'outlets_backup%'
ORDER BY tablename DESC;
"
echo ""

# Check 7: Data integrity checks
echo -e "${YELLOW}[7] Data Integrity Checks:${NC}"

# Check for NULL values
NULL_CHECKIN=$(psql $DB_URL -t -c "SELECT COUNT(*) FROM outlet_settings WHERE check_in_time IS NULL;")
NULL_CHECKOUT=$(psql $DB_URL -t -c "SELECT COUNT(*) FROM outlet_settings WHERE check_out_time IS NULL;")
NULL_SALARY=$(psql $DB_URL -t -c "SELECT COUNT(*) FROM outlet_settings WHERE salary IS NULL;")
EMPTY_DAYS=$(psql $DB_URL -t -c "SELECT COUNT(*) FROM outlet_settings WHERE day IS NULL OR array_length(day, 1) IS NULL;")

if [ "$NULL_CHECKIN" -eq 0 ] && [ "$NULL_CHECKOUT" -eq 0 ] && [ "$NULL_SALARY" -eq 0 ] && [ "$EMPTY_DAYS" -eq 0 ]; then
    echo -e "    ${GREEN}✓ No NULL values found${NC}"
else
    echo -e "    ${RED}⚠ Data integrity issues found:${NC}"
    [ "$NULL_CHECKIN" -gt 0 ] && echo -e "      - ${NULL_CHECKIN} settings with NULL check_in_time"
    [ "$NULL_CHECKOUT" -gt 0 ] && echo -e "      - ${NULL_CHECKOUT} settings with NULL check_out_time"
    [ "$NULL_SALARY" -gt 0 ] && echo -e "      - ${NULL_SALARY} settings with NULL salary"
    [ "$EMPTY_DAYS" -gt 0 ] && echo -e "      - ${EMPTY_DAYS} settings with empty days array"
fi
echo ""

# Summary
echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}SUMMARY${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo -e "Total Outlets:          ${GREEN}${TOTAL_OUTLETS}${NC}"
echo -e "Total Settings:         ${GREEN}${TOTAL_SETTINGS}${NC}"
echo -e "Outlets without settings: ${RED}${NO_SETTINGS}${NC}"

if [ "$NO_SETTINGS" -eq 0 ] && [ "$NULL_CHECKIN" -eq 0 ] && [ "$NULL_CHECKOUT" -eq 0 ] && [ "$NULL_SALARY" -eq 0 ] && [ "$EMPTY_DAYS" -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓✓✓ MIGRATION SUCCESSFUL! ✓✓✓${NC}"
    echo -e "${GREEN}All data migrated correctly.${NC}"
else
    echo ""
    echo -e "${YELLOW}⚠ MIGRATION NEEDS ATTENTION ⚠${NC}"
    echo -e "${YELLOW}Please review the issues above.${NC}"
fi
echo ""
