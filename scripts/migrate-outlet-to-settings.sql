-- ============================================================================
-- OUTLET SCHEMA MIGRATION SQL
-- ============================================================================
-- This SQL script migrates outlet data from the old schema to new schema.
-- Run this AFTER you've updated your Prisma schema and run migrations.
--
-- OLD SCHEMA: outlets (check_in_time, check_out_time, salary, pic_phone)
-- NEW SCHEMA: outlet_settings (outlet_id, check_in_time, check_out_time, salary, day[])
-- ============================================================================

-- Step 1: Create backup table
DO $$
BEGIN
    EXECUTE format('CREATE TABLE IF NOT EXISTS outlets_backup_%s AS SELECT * FROM outlets', 
                   to_char(now(), 'YYYYMMDD_HH24MISS'));
    RAISE NOTICE 'Backup table created successfully';
END $$;

-- Step 2: Show current outlets data (for verification)
SELECT 
    id,
    name,
    check_in_time,
    check_out_time,
    salary,
    pic_phone
FROM outlets
WHERE check_in_time IS NOT NULL
LIMIT 10;

-- Step 3: Migrate data to outlet_settings table
-- This creates one setting per outlet with weekday schedule (Mon-Fri)
INSERT INTO outlet_settings (
    outlet_id, 
    check_in_time, 
    check_out_time, 
    salary, 
    day, 
    "createdAt", 
    "updatedAt"
)
SELECT 
    id as outlet_id,
    check_in_time,
    check_out_time,
    salary,
    ARRAY['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']::"DAY"[] as day,
    NOW() as "createdAt",
    NOW() as "updatedAt"
FROM outlets
WHERE check_in_time IS NOT NULL 
  AND check_out_time IS NOT NULL 
  AND salary IS NOT NULL
ON CONFLICT DO NOTHING;

-- Step 4: Verify migration
SELECT 
    COUNT(*) as total_settings_created
FROM outlet_settings;

-- Step 5: Show migrated data
SELECT 
    os.id,
    os.outlet_id,
    o.name as outlet_name,
    os.check_in_time,
    os.check_out_time,
    os.salary,
    os.day,
    os."createdAt"
FROM outlet_settings os
JOIN outlets o ON o.id = os.outlet_id
ORDER BY os.outlet_id;

-- Step 6: Verify each outlet has settings
SELECT 
    o.id,
    o.name,
    o.code,
    COUNT(os.id) as settings_count,
    o.is_active
FROM outlets o
LEFT JOIN outlet_settings os ON os.outlet_id = o.id
GROUP BY o.id, o.name, o.code, o.is_active
ORDER BY o.id;

-- ============================================================================
-- NOTES:
-- ============================================================================
-- 1. This script creates DEFAULT weekday settings (Mon-Fri) for each outlet
-- 2. If you need weekend settings, add them via the API or add additional INSERT
-- 3. The old columns (check_in_time, check_out_time, salary, pic_phone) should
--    be removed by Prisma migration
-- 4. Backup table is created automatically with timestamp
-- ============================================================================
