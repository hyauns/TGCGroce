ALTER TABLE products ADD COLUMN IF NOT EXISTS brands VARCHAR(255);

-- Backfill data using the precise mapped values
UPDATE products 
SET brands = 'Wizards of the Coast' 
WHERE category = 'Magic: The Gathering' AND (brands IS NULL OR brands = '');

UPDATE products 
SET brands = 'The Pokémon Company' 
WHERE category = 'Pokemon' AND (brands IS NULL OR brands = '');

UPDATE products 
SET brands = 'Konami' 
WHERE category = 'Yu-Gi-Oh!' AND (brands IS NULL OR brands = '');

UPDATE products 
SET brands = 'Disney Lorcana' 
WHERE category = 'Disney Lorcana' AND (brands IS NULL OR brands = '');

UPDATE products 
SET brands = 'Bandai' 
WHERE category IN ('One Piece', 'Digimon Card Game', 'Digimon Card') AND (brands IS NULL OR brands = '');

UPDATE products 
SET brands = 'Fantasy Flight Games' 
WHERE category = 'Star Wars: Unlimited' AND (brands IS NULL OR brands = '');

UPDATE products 
SET brands = 'Legend Story Studios' 
WHERE category = 'Flesh and Blood' AND (brands IS NULL OR brands = '');
