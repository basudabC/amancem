# Database Migration Instructions

## Quick Start

Run these SQL files in your **Supabase SQL Editor** in this exact order:

### Step 1: Add Customer Fields
```sql
-- File: 01_add_customer_fields.sql
-- Adds ~30 missing fields for shops and projects
-- Includes: owner info, sales data, brand preferences, construction details
```

### Step 2: Add Conversion/Sales Fields  
```sql
-- File: 02_add_conversion_fields.sql
-- Adds complete sales recording fields
-- Includes: product details, payment info, delivery tracking
```

### Step 3: Add Functions & Triggers
```sql
-- File: 03_add_functions_triggers.sql
-- Adds business logic automation
-- Includes: GPS validation, cement calculations, auto-archive
```

## What Gets Fixed

✅ **GPS Validation** - 200m radius check + speed validation  
✅ **Project Calculations** - Auto-calculate cement requirements  
✅ **Payment Validation** - Cash + Credit = Total check  
✅ **Sale ID Generation** - Auto-generate ACM-2025-XXXXX  
✅ **Auto-Archive** - Complete projects archived automatically  
✅ **Complete Data Capture** - All workflow fields now available  

## Testing

After running migrations, test with these queries:

```sql
-- Test GPS validation
SELECT * FROM validate_gps_checkin(23.8715, 90.3985, 23.8720, 90.3990, 15);

-- Test cement calculation  
SELECT calculate_cement_requirement(1200, 3, 'RCC');

-- Test sale ID generation
SELECT generate_sale_id();
```

## Next Steps

After database migrations:
1. Update TypeScript types (`src/types/database.ts`)
2. Update frontend forms (Customers, Visits, Conversions)
3. Add GPS validation to check-in UI
4. Add payment validation to sales form
5. Test complete workflow end-to-end

## Troubleshooting

**Error: "check constraint violated"**
- The migration handles this by updating existing data first
- Run `01_add_customer_fields.sql` which fixes existing records

**Error: "function already exists"**
- The migrations use `CREATE OR REPLACE` - safe to re-run
- Drop triggers first if needed: `DROP TRIGGER IF EXISTS trigger_name ON table_name;`

## Files Created

- `01_add_customer_fields.sql` - Customer table enhancements
- `02_add_conversion_fields.sql` - Conversions/sales table enhancements  
- `03_add_functions_triggers.sql` - Functions and triggers
- `00_run_all_migrations.sql` - Master script (optional)
