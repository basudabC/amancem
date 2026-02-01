## 🔍 Troubleshooting the 400 Error

The 400 error is still happening. Let's verify and fix it properly.

### **Step 1: Run Verification Script**

I've created [verify_sales_rep_id.sql](file:///c:/Users/Victus1/Downloads/Kimi_Agent_Aman%20Cement%20CRMv2/app/supabase/verify_sales_rep_id.sql)

**Run this in Supabase SQL Editor** - it will:
1. Check if `sales_rep_id` column exists
2. Add it if missing
3. Test the exact query the app is making

### **Step 2: Check Results**

After running the script, look for:
- ✅ "Added sales_rep_id column" OR "sales_rep_id column already exists"
- ✅ Sample data showing both `assigned_to` and `sales_rep_id`
- ✅ Test query results with joined data

### **Step 3: Common Issues**

If the verification shows the column exists but you still get 400 errors:

**Issue A: RLS Policies blocking the join**
```sql
-- Check RLS policies on customers
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'customers';

-- If needed, temporarily disable RLS to test
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
```

**Issue B: No data in customers table**
```sql
-- Check if there are any customers
SELECT COUNT(*) FROM customers;

-- If zero, insert test data
INSERT INTO customers (name, status, pipeline) 
VALUES ('Test Customer', 'active', 'recurring');
```

**Issue C: Territories table missing**
```sql
-- Check if territories table exists
SELECT COUNT(*) FROM territories;
```

### **Quick Debug:**

Run this to see the EXACT error from Supabase:
```sql
-- Enable detailed error logging
SET client_min_messages TO DEBUG;

-- Try the query
SELECT *
FROM customers
WHERE status = 'active'
LIMIT 1;
```

Let me know what the verification script shows!
