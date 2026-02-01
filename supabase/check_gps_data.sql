-- Check if GPS coordinates are being saved
SELECT 
    name,
    address,
    lat,
    lng,
    latitude,
    longitude,
    created_at
FROM customers
WHERE name = 'Raj Construction'
ORDER BY created_at DESC
LIMIT 1;

-- Check all recent customers for GPS data
SELECT 
    name,
    address,
    lat,
    lng,
    created_at
FROM customers
ORDER BY created_at DESC
LIMIT 10;
