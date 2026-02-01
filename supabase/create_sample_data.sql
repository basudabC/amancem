-- ============================================================
-- CREATE SAMPLE DATA FOR TESTING
-- ============================================================
-- This creates sample territories and customers so the app has data to display
-- ============================================================

-- Step 1: Insert sample customers
INSERT INTO customers (
  name,
  contact_person,
  phone,
  email,
  address,
  lat,
  lng,
  territory_id,
  pipeline,
  status,
  shop_name,
  monthly_volume,
  sales_rep_id,
  assigned_to,
  assigned_by,
  assigned_at,
  created_by,
  created_at
) VALUES
  (
    'ABC Construction Ltd',
    'John Doe',
    '+880-1711-123456',
    'john@abcconstruction.com',
    'House 10, Road 5, Gulshan, Dhaka',
    23.7808875,
    90.4161459,
    (SELECT id FROM territories LIMIT 1),
    'recurring',
    'active',
    'ABC Construction',
    500.00,
    (SELECT id FROM profiles WHERE role = 'country_head' LIMIT 1),
    (SELECT id FROM profiles WHERE role = 'country_head' LIMIT 1),
    (SELECT id FROM profiles WHERE role = 'country_head' LIMIT 1),
    NOW(),
    (SELECT id FROM profiles WHERE role = 'country_head' LIMIT 1),
    NOW()
  ),
  (
    'XYZ Builders',
    'Jane Smith',
    '+880-1712-234567',
    'jane@xyzbuilders.com',
    'House 20, Road 10, Banani, Dhaka',
    23.7937,
    90.4066,
    (SELECT id FROM territories LIMIT 1),
    'recurring',
    'active',
    'XYZ Builders',
    750.00,
    (SELECT id FROM profiles WHERE role = 'country_head' LIMIT 1),
    (SELECT id FROM profiles WHERE role = 'country_head' LIMIT 1),
    (SELECT id FROM profiles WHERE role = 'country_head' LIMIT 1),
    NOW(),
    (SELECT id FROM profiles WHERE role = 'country_head' LIMIT 1),
    NOW()
  ),
  (
    'Prime Cement Dealers',
    'Ahmed Khan',
    '+880-1713-345678',
    'ahmed@primecement.com',
    'House 30, Road 15, Dhanmondi, Dhaka',
    23.7461,
    90.3742,
    (SELECT id FROM territories LIMIT 1),
    'recurring',
    'active',
    'Prime Cement Dealers',
    1000.00,
    (SELECT id FROM profiles WHERE role = 'country_head' LIMIT 1),
    (SELECT id FROM profiles WHERE role = 'country_head' LIMIT 1),
    (SELECT id FROM profiles WHERE role = 'country_head' LIMIT 1),
    NOW(),
    (SELECT id FROM profiles WHERE role = 'country_head' LIMIT 1),
    NOW()
  ),
  (
    'Metro Construction',
    'Fatima Rahman',
    '+880-1714-456789',
    'fatima@metroconstruction.com',
    'House 40, Road 20, Uttara, Dhaka',
    23.8759,
    90.3795,
    (SELECT id FROM territories LIMIT 1),
    'one_time',
    'prospect',
    NULL,
    NULL,
    (SELECT id FROM profiles WHERE role = 'country_head' LIMIT 1),
    (SELECT id FROM profiles WHERE role = 'country_head' LIMIT 1),
    (SELECT id FROM profiles WHERE role = 'country_head' LIMIT 1),
    NOW(),
    (SELECT id FROM profiles WHERE role = 'country_head' LIMIT 1),
    NOW()
  ),
  (
    'City Builders Ltd',
    'Karim Hossain',
    '+880-1715-567890',
    'karim@citybuilders.com',
    'House 50, Road 25, Mirpur, Dhaka',
    23.8223,
    90.3654,
    (SELECT id FROM territories LIMIT 1),
    'recurring',
    'active',
    'City Builders',
    600.00,
    (SELECT id FROM profiles WHERE role = 'country_head' LIMIT 1),
    (SELECT id FROM profiles WHERE role = 'country_head' LIMIT 1),
    (SELECT id FROM profiles WHERE role = 'country_head' LIMIT 1),
    NOW(),
    (SELECT id FROM profiles WHERE role = 'country_head' LIMIT 1),
    NOW()
  );

-- Step 2: Verify data was inserted
SELECT 
    COUNT(*) as total_customers,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_customers,
    COUNT(CASE WHEN pipeline = 'recurring' THEN 1 END) as recurring_customers
FROM customers;

-- Step 3: Show sample data
SELECT 
    c.id,
    c.name,
    c.contact_person,
    c.status,
    c.pipeline,
    t.name as territory_name,
    p.full_name as sales_rep_name
FROM customers c
LEFT JOIN territories t ON c.territory_id = t.id
LEFT JOIN profiles p ON c.sales_rep_id = p.id
LIMIT 10;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Sample customers created successfully!';
  RAISE NOTICE '✅ Refresh your browser now!';
  RAISE NOTICE '✅ Dashboard and Map should now show data!';
  RAISE NOTICE '========================================';
END $$;
