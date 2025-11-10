# Outlet Schema Migration Guide

## Overview
This guide helps you migrate from the old outlet schema (single schedule) to the new schema (multiple settings per outlet).

## What Changed

### Old Schema (Untitled-12)
```prisma
model Outlet {
  id              Int       @id @default(autoincrement())
  name            String
  location        String
  code            String    @unique @default(uuid())
  pic_phone       String    ← REMOVED
  description     String?
  check_in_time   String    ← MOVED to OutletSetting
  check_out_time  String    ← MOVED to OutletSetting
  salary          Int       ← MOVED to OutletSetting
  income_target   Int       @default(0)
  is_active       Boolean   @default(true)
  user_id         Int       @unique
  // ... relations
}
```

### New Schema (schema.prisma)
```prisma
model Outlet {
  id              Int             @id @default(autoincrement())
  name            String
  location        String
  code            String          @unique @default(uuid())
  description     String?
  income_target   Int             @default(0)
  is_active       Boolean         @default(true)
  user_id         Int             @unique
  settings        OutletSetting[] ← NEW RELATION
  // ... other relations
}

model OutletSetting {
  id              Int      @id @default(autoincrement())
  outlet_id       Int
  check_in_time   String
  check_out_time  String
  salary          Int
  day             DAY[]    ← NEW: Array of days
  outlet          Outlet   @relation(fields: [outlet_id], references: [id])
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

## Migration Steps

### Option 1: Using Shell Script (Recommended)

1. **Ensure you have a backup**
   ```bash
   # The script will create a backup automatically, but you can create one manually too
   pg_dump $ADAPTER_PRISMA_POSTGRES_URL > backup_$(date +%Y%m%d).sql
   ```

2. **Run the migration script**
   ```bash
   cd scripts
   ./migrate-outlet-to-settings.sh
   ```

3. **Follow the interactive prompts**
   - The script will show you what data will be migrated
   - You'll be asked to confirm before proceeding
   - It will show progress for each step

4. **Verify the migration**
   - Check that all outlets have settings
   - Test the API endpoints
   - Verify data integrity

### Option 2: Using SQL Script Directly

1. **First, run Prisma migration**
   ```bash
   npx prisma migrate dev --name migrate_outlet_to_settings
   ```

2. **Then run the SQL script**
   ```bash
   psql $ADAPTER_PRISMA_POSTGRES_URL -f scripts/migrate-outlet-to-settings.sql
   ```

3. **Review the output**
   - Check for any errors
   - Verify row counts
   - Inspect sample data

### Option 3: Manual Migration via psql

```bash
# 1. Connect to database
psql $ADAPTER_PRISMA_POSTGRES_URL

# 2. Create backup
CREATE TABLE outlets_backup AS SELECT * FROM outlets;

# 3. Check current data
SELECT id, name, check_in_time, check_out_time, salary FROM outlets;

# 4. Run Prisma migration (in another terminal)
npx prisma migrate dev --name migrate_outlet_to_settings

# 5. Migrate data to outlet_settings
INSERT INTO outlet_settings (outlet_id, check_in_time, check_out_time, salary, day, "createdAt", "updatedAt")
SELECT 
    id,
    check_in_time,
    check_out_time,
    salary,
    ARRAY['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']::"DAY"[],
    NOW(),
    NOW()
FROM outlets_backup
WHERE check_in_time IS NOT NULL;

# 6. Verify
SELECT o.id, o.name, COUNT(os.id) as settings_count
FROM outlets o
LEFT JOIN outlet_settings os ON os.outlet_id = o.id
GROUP BY o.id, o.name;
```

## What the Migration Does

1. **Creates Backup**: Automatically backs up the outlets table
2. **Preserves Data**: Copies `check_in_time`, `check_out_time`, and `salary` to outlet_settings
3. **Sets Default Days**: Creates settings for weekdays (Monday-Friday) by default
4. **Maintains Relationships**: All foreign keys and relations remain intact
5. **No Data Loss**: Original data is backed up before any changes

## Default Behavior

- Each old outlet record creates **ONE** outlet_setting record
- Default days: `['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']`
- If you need weekend settings or multiple shifts, add them via API after migration

## Post-Migration Tasks

### 1. Verify Migration
```bash
# Check outlets with settings count
psql $ADAPTER_PRISMA_POSTGRES_URL -c "
SELECT 
    o.id,
    o.name,
    COUNT(os.id) as settings_count
FROM outlets o
LEFT JOIN outlet_settings os ON os.outlet_id = o.id
GROUP BY o.id, o.name
ORDER BY settings_count DESC, o.id;
"
```

### 2. Test API Endpoints
```bash
# GET outlet by ID
curl http://localhost:3000/api/v1/outlets/1

# POST new outlet
curl -X POST http://localhost:3000/api/v1/outlets \
  -H "Content-Type: application/json" \
  -d @your-test-data.json
```

### 3. Add Weekend Settings (if needed)
Use the PUT endpoint to add weekend settings:
```json
{
  "setting": [
    {
      "id": 1,
      "checkin_time": "08:00:00",
      "checkout_time": "16:00:00",
      "salary": 150000,
      "days": ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"]
    },
    {
      "checkin_time": "09:00:00",
      "checkout_time": "17:00:00",
      "salary": 200000,
      "days": ["SATURDAY", "SUNDAY"]
    }
  ]
}
```

## Rollback Plan

If something goes wrong:

1. **Restore from backup**
   ```sql
   -- Find your backup table
   SELECT tablename FROM pg_tables WHERE tablename LIKE 'outlets_backup%';
   
   -- Restore data (replace with your backup table name)
   DELETE FROM outlet_settings;
   -- Then restore old schema using Prisma migrate
   ```

2. **Revert Prisma migration**
   ```bash
   npx prisma migrate resolve --rolled-back <migration_name>
   ```

## Troubleshooting

### Issue: "Table outlets_backup already exists"
```sql
-- Drop old backup if you're sure you don't need it
DROP TABLE outlets_backup_YYYYMMDD_HHMMSS;
```

### Issue: "Migration fails halfway"
- Check the backup table - your data is safe
- Review error messages
- Contact support or check logs
- You can rerun the migration after fixing issues

### Issue: "Some outlets have no settings"
```sql
-- Find outlets without settings
SELECT o.id, o.name 
FROM outlets o
LEFT JOIN outlet_settings os ON os.outlet_id = o.id
WHERE os.id IS NULL;

-- Add default settings manually
INSERT INTO outlet_settings (outlet_id, check_in_time, check_out_time, salary, day)
VALUES (outlet_id_here, '08:00:00', '16:00:00', 150000, ARRAY['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']::"DAY"[]);
```

## Notes

- **pic_phone** field is removed - it's now fetched from assigned employees
- Old columns are dropped by Prisma migration
- Backup tables are kept for safety - you can drop them later
- Default weekday schedule is Mon-Fri
- Multiple shifts per outlet are now supported

## Support

If you encounter issues:
1. Check the backup table exists
2. Review migration logs
3. Test with a single outlet first
4. Keep the backup table until you're confident
