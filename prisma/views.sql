-- View: AvailableProduct
-- Computes real-time dynamic product availability based on inventory and vendor account status,
-- and flattens store details (including storeName from StoreAddress) for high-performance customer feeds.

DROP VIEW IF EXISTS "AvailableProduct" CASCADE;

CREATE VIEW "AvailableProduct" AS
SELECT 
  p.id,
  p.name,
  p.quantity,
  p.price,
  p."discountedPrice",
  p."storeId",
  sa."storeName",
  (p.quantity > 0 AND NOT u.ban AND u.status = 'ACCEPTED') AS "isAvailable"
FROM "Product" p
JOIN "Store" s ON p."storeId" = s.id
JOIN "User" u ON s."vendorId" = u.id
LEFT JOIN "StoreAddress" sa ON s.id = sa."storeId";
