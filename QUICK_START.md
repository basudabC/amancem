# Quick Start Guide - Aman Cement CRM

## 🚀 Getting the App Running

### Step 1: Create Test Users in Supabase

1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard
2. **Navigate to**: Authentication > Users
3. **Click "Add User"** and create these two users:

#### Admin User
- **Email**: `admin@amancement.com`
- **Password**: `Admin@123`
- **Auto Confirm Email**: ✅ YES (check this box!)

#### Sales Rep User
- **Email**: `salesrep@amancement.com`
- **Password**: `Sales@123`
- **Auto Confirm Email**: ✅ YES (check this box!)

### Step 2: Create User Profiles

After creating the users above, **copy their UUIDs** from the users list, then:

1. Go to **SQL Editor** in Supabase
2. Run this SQL (replace the UUIDs with your actual user UUIDs):

```sql
-- Get the UUIDs first
SELECT id, email FROM auth.users ORDER BY created_at DESC;

-- Then create profiles (replace YOUR-ADMIN-UUID and YOUR-SALESREP-UUID)
INSERT INTO profiles (id, employee_code, full_name, email, role, region, area, target_monthly, is_active)
VALUES 
  ('YOUR-ADMIN-UUID'::uuid, 'EMP001', 'Admin User', 'admin@amancement.com', 'country_head', 'National', 'Head Office', 0, true),
  ('YOUR-SALESREP-UUID'::uuid, 'EMP002', 'Sales Rep', 'salesrep@amancement.com', 'sales_rep', 'North', 'Area 1', 100000, true)
ON CONFLICT (id) DO NOTHING;
```

### Step 3: Access the App

1. **Open**: http://localhost:5173
2. **Login with**:
   - Email: `admin@amancement.com`
   - Password: `Admin@123`

## 🔧 Troubleshooting

### App Still Loading?

1. **Open Browser Console** (F12)
2. **Look for these logs**:
   - 🔐 Initializing authentication...
   - ✅ Auth initialization complete

3. **If you see errors**:
   - Check that you created the profiles in Step 2
   - Verify the UUIDs match between auth.users and profiles
   - Make sure email is confirmed (Auto Confirm was checked)

### Verify Setup

Run this in Supabase SQL Editor:

```sql
-- This should show both users with their profiles
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  p.full_name,
  p.role,
  p.is_active
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
ORDER BY u.created_at DESC;
```

## 📝 Login Credentials

**Admin Account**:
- Email: admin@amancement.com
- Password: Admin@123
- Role: Country Head (full access)

**Sales Rep Account**:
- Email: salesrep@amancement.com
- Password: Sales@123
- Role: Sales Representative

## ⚡ Quick Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Type check
npm run type-check
```

## 🎯 Next Steps

After logging in successfully:
1. Explore the dashboard
2. Check the map view
3. Add some test customers
4. Create territories

Need help? Check the full documentation in `DEPLOYMENT_GUIDE.md`
