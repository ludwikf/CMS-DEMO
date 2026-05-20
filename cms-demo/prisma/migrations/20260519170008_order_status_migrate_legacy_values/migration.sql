UPDATE "Order" SET status = 'UNCONFIRMED' WHERE status::text = 'unconfirmed';
UPDATE "Order" SET status = 'IN_PROGRESS' WHERE status::text = 'inProgress';
UPDATE "Order" SET status = 'CONFIRMED' WHERE status::text = 'confirmed';
UPDATE "Order" SET status = 'DELIVERED' WHERE status::text IN ('delivery', 'pickup');
UPDATE "Order" SET status = 'CANCELLED' WHERE status::text = 'cancelled';
UPDATE "Order" SET status = 'FINISHED' WHERE status::text = 'finished';
