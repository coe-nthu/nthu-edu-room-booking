-- Clean up room descriptions by removing the type info in parentheses
-- Example: "B111 - B1F (Meeting)" -> "B111 - B1F"

UPDATE rooms
SET description = TRIM(SPLIT_PART(description, '(', 1));
