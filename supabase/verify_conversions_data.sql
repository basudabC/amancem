-- Verify conversions data is correctly stored
SELECT 
    id,
    customer_id,
    converted_by,
    converted_at,
    product,
    quantity_bags,
    unit_price,
    total_value,
    payment_type,
    cash_amount,
    credit_amount,
    sale_notes
FROM conversions
ORDER BY converted_at DESC
LIMIT 10;

-- Check if sales rep can see their conversions
SELECT 
    c.id,
    c.total_value,
    c.quantity_bags,
    c.product,
    p.full_name as sales_rep,
    cust.name as customer_name
FROM conversions c
LEFT JOIN profiles p ON c.converted_by = p.id
LEFT JOIN customers cust ON c.customer_id = cust.id
ORDER BY c.converted_at DESC;
