-- Migration to add hpp (Harga Pokok Penjualan) field to the product table

-- Add the hpp column to product_menus table
ALTER TABLE product_menus 
ADD COLUMN IF NOT EXISTS hpp FLOAT DEFAULT 0;

-- Update product_menus table to ensure hpp field exists with proper constraints
-- The hpp (Harga Pokok Penjualan) represents the cost of goods sold for the product
-- It's used for calculating profit margins and financial reports