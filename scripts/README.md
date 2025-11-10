# Scripts Directory

This directory contains various utility scripts for the Corndog-Kane API project.

## Available Scripts

### 🔄 Migration Scripts

#### `migrate-outlet-to-settings.sh`
Migrates outlet data from old schema (single schedule) to new schema (multiple settings).

**Usage:**
```bash
cd scripts
./migrate-outlet-to-settings.sh
```

**What it does:**
- Creates backup of existing data
- Migrates `check_in_time`, `check_out_time`, `salary` to `outlet_settings` table
- Sets default weekday schedule (Mon-Fri)
- Removes old columns from outlets table
- Preserves all data (no data loss)

**See also:** `MIGRATION_GUIDE.md` for detailed instructions

---

#### `migrate-outlet-to-settings.sql`
SQL-only version of the migration (for manual execution).

**Usage:**
```bash
psql $ADAPTER_PRISMA_POSTGRES_URL -f scripts/migrate-outlet-to-settings.sql
```

---

#### `verify-migration.sh`
Verifies that the outlet migration was successful.

**Usage:**
```bash
cd scripts
./verify-migration.sh
```

**Checks:**
- Total outlets and settings count
- Outlets without settings
- Settings distribution
- Data integrity (NULL values, empty arrays)
- Backup table existence

---

### 🏗️ Resource Generation

#### `create-resource.js`
Automatically generates a complete resource with all necessary files.

**Usage:**
```bash
npm run generate:resource -- --name=<resource-name>
```

**Example:**
```bash
npm run generate:resource -- --name=material
```

**See:** `CREATE_RESOURCE.md` for detailed documentation

---

#### `remove-resource.js`
Removes a resource and all its associated files.

**Usage:**
```bash
npm run remove:resource -- --name=<resource-name>
```

---

### 🚀 Deployment Scripts

#### `deploy.sh`
Deployment script for the API server.

**Usage:**
```bash
./scripts/deploy.sh
```

---

#### `setup-server.sh`
Initial server setup script.

**Usage:**
```bash
./scripts/setup-server.sh
```

---

#### `health-check.sh`
Health check script for monitoring.

**Usage:**
```bash
./scripts/health-check.sh
```

---

### 🧪 Testing Scripts

#### `test-websocket-stock.sh`
Tests WebSocket stock functionality.

**Usage:**
```bash
./scripts/test-websocket-stock.sh
```

---

## Migration Workflow

When migrating from old outlet schema to new:

1. **Read the guide first:**
   ```bash
   cat scripts/MIGRATION_GUIDE.md
   ```

2. **Run migration:**
   ```bash
   cd scripts
   ./migrate-outlet-to-settings.sh
   ```

3. **Verify migration:**
   ```bash
   ./verify-migration.sh
   ```

4. **Test API:**
   ```bash
   # Test GET outlet
   curl http://localhost:3000/api/v1/outlets/1
   
   # Test POST outlet
   curl -X POST http://localhost:3000/api/v1/outlets \
     -H "Content-Type: application/json" \
     -d @test-data.json
   ```

5. **If successful, you can optionally drop backup tables later:**
   ```sql
   -- List backups
   SELECT tablename FROM pg_tables WHERE tablename LIKE 'outlets_backup%';
   
   -- Drop specific backup (after verification!)
   DROP TABLE outlets_backup_YYYYMMDD_HHMMSS;
   ```

## Notes

- All shell scripts require execute permissions (`chmod +x script.sh`)
- Migration scripts create automatic backups
- Always test in development before running in production
- Keep backup tables until you're confident everything works
- SQL scripts are for PostgreSQL databases

## Troubleshooting

### Permission Denied
```bash
chmod +x scripts/*.sh
```

### Database Connection Error
Check your `.env` file has `ADAPTER_PRISMA_POSTGRES_URL`

### Migration Already Run
Check if `outlet_settings` table already has data:
```sql
SELECT COUNT(*) FROM outlet_settings;
```

## Support Files

- `MIGRATION_GUIDE.md` - Comprehensive migration documentation
- `CREATE_RESOURCE.md` - Resource generation guide
- `corndog-kane-api.service` - Systemd service file
