-- Seed products table from data/products.json
-- products schema: id (integer), name, category, price, original_price, stock_quantity, cost, is_active
-- Uses INSERT ... ON CONFLICT (id) DO UPDATE so re-running is safe.

INSERT INTO products (id, name, category, price, original_price, stock_quantity, cost, is_active)
VALUES
  (1,  'Magic: The Gathering - Foundations Booster Box',          'Magic: The Gathering',   89.99,  109.99,  25, 65.00, true),
  (2,  'Pokemon TCG - Scarlet & Violet Base Set Booster Box',     'Pokemon',               144.99,  169.99,  18, 99.00, true),
  (3,  'Yu-Gi-Oh! - Age of Overlords Booster Box',               'Yu-Gi-Oh!',              79.99,   99.99,  32, 55.00, true),
  (4,  'Disney Lorcana - Into the Inklands Booster Box',         'Disney Lorcana',         143.99,  159.99,   0, 95.00, true),
  (5,  'One Piece Card Game - Kingdoms of Intrigue Booster Box', 'One Piece Card Game',     89.99,  109.99,  15, 62.00, true),
  (6,  'Flesh and Blood - Part the Mistveil Booster Box',        'Flesh and Blood',         99.99,  119.99,   8, 70.00, true),
  (7,  'Magic: The Gathering - Murders at Karlov Manor Bundle',  'Magic: The Gathering',    44.99,   54.99,  42, 30.00, true),
  (8,  'Pokemon TCG - Paldean Fates Elite Trainer Box',          'Pokemon',                 49.99,   59.99,  28, 35.00, true),
  (9,  'Tarkir Dragonstorm Bundle',                              'Magic: The Gathering',    89.99,  109.99,  12, 65.00, true),
  (10, 'Edge of Eternities Collector Box',                       'Magic: The Gathering',   149.99,  179.99,   6, 110.00, true),
  (11, 'Tarkir Play Booster Display',                            'Magic: The Gathering',   144.99,  169.99,  20, 99.00, true),
  (12, 'Digimon Card Game - Exceed Apocalypse Booster Box',      'Digimon Card Game',       89.99,  109.99,  14, 62.00, true),
  (13, 'Star Wars: Unlimited - Spark of Rebellion Booster Box',  'Star Wars: Unlimited',   119.99,  139.99,  22, 85.00, true)
ON CONFLICT (id) DO UPDATE
  SET name           = EXCLUDED.name,
      category       = EXCLUDED.category,
      price          = EXCLUDED.price,
      original_price = EXCLUDED.original_price,
      stock_quantity = EXCLUDED.stock_quantity,
      cost           = EXCLUDED.cost,
      is_active      = EXCLUDED.is_active,
      updated_at     = NOW();

-- Reset the id sequence so future inserts don't collide
SELECT setval(pg_get_serial_sequence('products', 'id'), (SELECT MAX(id) FROM products));
