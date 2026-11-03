INSERT INTO products (slug, name, description, category, price, image_url, badge, stock) VALUES
('arc-lounge-chair', 'Arc lounge chair', 'A sculptural oak frame meets a soft, generous seat in this everyday favorite.', 'Living', 40800.00, 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=900&q=82', 'Bestseller', 12),
('form-pendant', 'Form pendant', 'A softly glowing pendant in hand-finished, warm-toned metal.', 'Lighting', 22525.00, 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=900&q=82', 'New', 9),
('linen-cushion', 'Everyday linen cushion', 'Washed European linen with a feather-soft recycled filling.', 'Textiles', 5780.00, 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=900&q=82', NULL, 25),
('stoneware-vase', 'Hand-thrown stoneware vase', 'Each one-of-a-kind vessel is shaped and glazed by hand.', 'Objects', 7820.00, 'https://images.unsplash.com/photo-1578500494198-246f612d3b3d?auto=format&fit=crop&w=900&q=82', 'Small batch', 8),
('lowline-side-table', 'Lowline side table', 'A quiet, sturdy companion made from responsibly sourced ash.', 'Living', 28900.00, 'https://images.unsplash.com/photo-1499933374294-4584851497cc?auto=format&fit=crop&w=900&q=82', NULL, 10),
('soft-glow-table-lamp', 'Soft glow table lamp', 'An ambient, linen-shaded lamp made for slower evenings.', 'Lighting', 16575.00, 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=82', NULL, 16),
('woven-market-tote', 'Woven market tote', 'A roomy, handwoven carryall made for everyday errands.', 'Textiles', 4590.00, 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=900&q=82', NULL, 30),
('daily-ritual-tray', 'Daily ritual tray', 'A considered landing place for the little things you reach for.', 'Objects', 4080.00, 'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=900&q=82', 'Made by hand', 18)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    description = VALUES(description),
    category = VALUES(category),
    price = VALUES(price),
    image_url = VALUES(image_url),
    badge = VALUES(badge);
