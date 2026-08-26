-- ====================================================================
-- AGRICONNECT FPO PLATFORM DATABASE SCHEMA & SEED SCRIPT
-- ====================================================================

-- Drop existing tables if re-running
DROP TABLE IF EXISTS settlement_lines CASCADE;
DROP TABLE IF EXISTS settlements CASCADE;
DROP TABLE IF EXISTS route_stops CASCADE;
DROP TABLE IF EXISTS pickup_routes CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS buyer_demands CASCADE;
DROP TABLE IF EXISTS lot_listings CASCADE;
DROP TABLE IF EXISTS lots CASCADE;
DROP TABLE IF EXISTS farmer_listings CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS fpos CASCADE;
DROP TABLE IF EXISTS mandi_prices CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. FPO TABLE
CREATE TABLE fpos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    registration_id TEXT UNIQUE NOT NULL,
    village TEXT NOT NULL,
    district TEXT NOT NULL,
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    verified BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. USER TABLE
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('farmer', 'fpo_manager', 'buyer', 'logistics')),
    village TEXT,
    district TEXT,
    latitude FLOAT,
    longitude FLOAT,
    fpo_id UUID REFERENCES fpos(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. FARMER_LISTING TABLE
CREATE TABLE farmer_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    crop TEXT NOT NULL,
    quantity_kg INTEGER NOT NULL CHECK (quantity_kg > 0),
    quality TEXT NOT NULL,
    ready_date DATE NOT NULL,
    expected_price_per_kg NUMERIC(10,2),
    village TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'listed' CHECK (status IN ('listed', 'lotted', 'matched', 'picked_up', 'delivered', 'settled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. LOT TABLE
CREATE TABLE lots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fpo_id UUID NOT NULL REFERENCES fpos(id) ON DELETE CASCADE,
    crop TEXT NOT NULL,
    total_quantity_kg INTEGER NOT NULL CHECK (total_quantity_kg > 0),
    quality TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'matched', 'in_transit', 'delivered')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. LOT_LISTING TABLE (Junction)
CREATE TABLE lot_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lot_id UUID NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
    farmer_listing_id UUID NOT NULL REFERENCES farmer_listings(id) ON DELETE CASCADE,
    quantity_kg INTEGER NOT NULL CHECK (quantity_kg > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. BUYER_DEMAND TABLE
CREATE TABLE buyer_demands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    crop TEXT NOT NULL,
    required_quantity_kg INTEGER NOT NULL CHECK (required_quantity_kg > 0),
    minimum_quality TEXT NOT NULL,
    maximum_price_per_kg NUMERIC(10,2) NOT NULL,
    delivery_location TEXT NOT NULL,
    delivery_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'matched', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. MATCH TABLE
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lot_id UUID NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
    buyer_demand_id UUID NOT NULL REFERENCES buyer_demands(id) ON DELETE CASCADE,
    match_score INTEGER NOT NULL CHECK (match_score >= 0 AND match_score <= 100),
    quantity_matched_kg INTEGER NOT NULL CHECK (quantity_matched_kg > 0),
    price_per_kg NUMERIC(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('proposed', 'confirmed', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. PICKUP_ROUTE TABLE
CREATE TABLE pickup_routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    logistics_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    fpo_id UUID NOT NULL REFERENCES fpos(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_distance_km NUMERIC(10,2) NOT NULL,
    total_quantity_kg INTEGER NOT NULL,
    number_of_stops INTEGER NOT NULL,
    transportation_cost NUMERIC(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. ROUTE_STOP TABLE
CREATE TABLE route_stops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pickup_route_id UUID NOT NULL REFERENCES pickup_routes(id) ON DELETE CASCADE,
    farmer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stop_sequence INTEGER NOT NULL,
    quantity_to_pick_kg INTEGER NOT NULL,
    pickup_status TEXT NOT NULL DEFAULT 'pending' CHECK (pickup_status IN ('pending', 'picked_up')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. SETTLEMENT TABLE
CREATE TABLE settlements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    fpo_id UUID NOT NULL REFERENCES fpos(id) ON DELETE CASCADE,
    buyer_value NUMERIC(12,2) NOT NULL,
    logistics_cost NUMERIC(12,2) NOT NULL,
    fpo_commission NUMERIC(12,2) NOT NULL,
    platform_fee NUMERIC(12,2) NOT NULL,
    total_farmer_payout NUMERIC(12,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. SETTLEMENT_LINE TABLE
CREATE TABLE settlement_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    settlement_id UUID NOT NULL REFERENCES settlements(id) ON DELETE CASCADE,
    farmer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    farmer_listing_id UUID NOT NULL REFERENCES farmer_listings(id) ON DELETE CASCADE,
    quantity_kg INTEGER NOT NULL,
    gross_value NUMERIC(12,2) NOT NULL,
    logistics_share NUMERIC(12,2) NOT NULL,
    fpo_commission NUMERIC(12,2) NOT NULL,
    platform_fee NUMERIC(12,2) NOT NULL,
    net_realization NUMERIC(12,2) NOT NULL,
    percentage_retained NUMERIC(5,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. MANDI_PRICE TABLE
CREATE TABLE mandi_prices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    crop TEXT NOT NULL,
    date DATE NOT NULL,
    price_per_kg NUMERIC(10,2) NOT NULL,
    source TEXT DEFAULT 'Demo Reference',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================================================================
-- INDEXES FOR FOREIGN KEYS AND QUERY PERFORMANCE
-- ====================================================================

CREATE INDEX idx_users_fpo_id ON users(fpo_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_farmer_listings_farmer_id ON farmer_listings(farmer_id);
CREATE INDEX idx_farmer_listings_status ON farmer_listings(status);
CREATE INDEX idx_lots_fpo_id ON lots(fpo_id);
CREATE INDEX idx_lots_status ON lots(status);
CREATE INDEX idx_lot_listings_lot_id ON lot_listings(lot_id);
CREATE INDEX idx_lot_listings_farmer_listing_id ON lot_listings(farmer_listing_id);
CREATE INDEX idx_buyer_demands_buyer_id ON buyer_demands(buyer_id);
CREATE INDEX idx_buyer_demands_status ON buyer_demands(status);
CREATE INDEX idx_matches_lot_id ON matches(lot_id);
CREATE INDEX idx_matches_buyer_demand_id ON matches(buyer_demand_id);
CREATE INDEX idx_pickup_routes_match_id ON pickup_routes(match_id);
CREATE INDEX idx_pickup_routes_fpo_id ON pickup_routes(fpo_id);
CREATE INDEX idx_pickup_routes_logistics_id ON pickup_routes(logistics_id);
CREATE INDEX idx_route_stops_pickup_route_id ON route_stops(pickup_route_id);
CREATE INDEX idx_route_stops_farmer_id ON route_stops(farmer_id);
CREATE INDEX idx_settlements_match_id ON settlements(match_id);
CREATE INDEX idx_settlements_fpo_id ON settlements(fpo_id);
CREATE INDEX idx_settlement_lines_settlement_id ON settlement_lines(settlement_id);
CREATE INDEX idx_settlement_lines_farmer_id ON settlement_lines(farmer_id);
CREATE INDEX idx_mandi_prices_crop_date ON mandi_prices(crop, date DESC);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) & POLICIES
-- ====================================================================
-- NOTE ON AUTHENTICATION LIMITATION:
-- Supabase Auth (auth.uid()) is not yet integrated with front-end user sessions
-- in this phase (the application currently uses role switching / store.currentUser).
-- Therefore, role-based user-specific policies (e.g. auth.uid() = farmer_id)
-- cannot be evaluated via Supabase JWTs yet.
--
-- Security Strategy:
-- 1. All tables have RLS enabled.
-- 2. Public read (SELECT) policies allow client queries for demonstration/benchmarking data.
-- 3. Controlled write (INSERT/UPDATE/DELETE) for demo listings is enabled for the farmer vertical slice.
-- 4. Server-side mutations use SUPABASE_SERVICE_ROLE_KEY via supabaseServer.ts, which bypasses RLS safely.
-- 5. When Supabase Auth is integrated in future steps, user-specific auth.uid() policies will replace the demo policies.

ALTER TABLE fpos ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmer_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE lot_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_demands ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE pickup_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlement_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE mandi_prices ENABLE ROW LEVEL SECURITY;

-- Read policies (SELECT)
CREATE POLICY "Allow public read access on fpos" ON fpos FOR SELECT USING (true);
CREATE POLICY "Allow public read access on users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow public read access on farmer_listings" ON farmer_listings FOR SELECT USING (true);
CREATE POLICY "Allow public read access on lots" ON lots FOR SELECT USING (true);
CREATE POLICY "Allow public read access on lot_listings" ON lot_listings FOR SELECT USING (true);
CREATE POLICY "Allow public read access on buyer_demands" ON buyer_demands FOR SELECT USING (true);
CREATE POLICY "Allow public read access on matches" ON matches FOR SELECT USING (true);
CREATE POLICY "Allow public read access on pickup_routes" ON pickup_routes FOR SELECT USING (true);
CREATE POLICY "Allow public read access on route_stops" ON route_stops FOR SELECT USING (true);
CREATE POLICY "Allow public read access on settlements" ON settlements FOR SELECT USING (true);
CREATE POLICY "Allow public read access on settlement_lines" ON settlement_lines FOR SELECT USING (true);
CREATE POLICY "Allow public read access on mandi_prices" ON mandi_prices FOR SELECT USING (true);

-- Farmer Lot Vertical Slice Policies (INSERT/UPDATE for client demo operations)
CREATE POLICY "Allow insert on farmer_listings" ON farmer_listings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on farmer_listings" ON farmer_listings FOR UPDATE USING (true);
CREATE POLICY "Allow insert on lots" ON lots FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on lots" ON lots FOR UPDATE USING (true);
CREATE POLICY "Allow insert on lot_listings" ON lot_listings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on lot_listings" ON lot_listings FOR UPDATE USING (true);

-- ====================================================================
-- SEEDED DEMO DATA INSERTS
-- ====================================================================

-- FPOs
INSERT INTO fpos (id, name, registration_id, village, district, latitude, longitude, verified)
VALUES 
  ('f0000000-0000-0000-0000-000000000001', 'Tamil Nadu Farmers Collective', 'TNFC-001', 'Sriperumbudur', 'Kanchipuram', 12.9050, 79.8500, true),
  ('f0000000-0000-0000-0000-000000000002', 'Chengalpattu Regional FPO', 'CR-002', 'Chengalpattu', 'Chengalpattu', 12.6750, 79.9510, true);

-- Users: FPO Managers
INSERT INTO users (id, name, phone, email, role, village, district, latitude, longitude, fpo_id)
VALUES
  ('u1000000-0000-0000-0000-000000000001', 'Rajan Kumar (FPO 1)', '+91 98401 23456', 'rajan@tnfc.org', 'fpo_manager', 'Sriperumbudur', 'Kanchipuram', 12.9050, 79.8500, 'f0000000-0000-0000-0000-000000000001'),
  ('u1000000-0000-0000-0000-000000000002', 'Suresh Vel (FPO 2)', '+91 98402 34567', 'suresh@crfpo.org', 'fpo_manager', 'Chengalpattu', 'Chengalpattu', 12.6750, 79.9510, 'f0000000-0000-0000-0000-000000000002');

-- Users: Farmers (6 total, all belonging to FPO 1)
INSERT INTO users (id, name, phone, email, role, village, district, latitude, longitude, fpo_id)
VALUES
  ('u0000000-0000-0000-0000-000000000001', 'Farmer A (Murugan)', '+91 94441 11001', 'farmer.a@agriconnect.org', 'farmer', 'Kanchipuram', 'Kanchipuram', 12.8432, 79.9111, 'f0000000-0000-0000-0000-000000000001'),
  ('u0000000-0000-0000-0000-000000000002', 'Farmer B (Selvam)', '+91 94441 11002', 'farmer.b@agriconnect.org', 'farmer', 'Kanchipuram', 'Kanchipuram', 12.8420, 79.9100, 'f0000000-0000-0000-0000-000000000001'),
  ('u0000000-0000-0000-0000-000000000003', 'Farmer C (Arul)', '+91 94441 11003', 'farmer.c@agriconnect.org', 'farmer', 'Tiruvallur', 'Tiruvallur', 13.1380, 79.9066, 'f0000000-0000-0000-0000-000000000001'),
  ('u0000000-0000-0000-0000-000000000004', 'Farmer D (Palani)', '+91 94441 11004', 'farmer.d@agriconnect.org', 'farmer', 'Chengalpattu', 'Chengalpattu', 12.6753, 79.9511, 'f0000000-0000-0000-0000-000000000001'),
  ('u0000000-0000-0000-0000-000000000005', 'Farmer E (Kannan)', '+91 94441 11005', 'farmer.e@agriconnect.org', 'farmer', 'Ranipet', 'Ranipet', 12.9245, 79.3495, 'f0000000-0000-0000-0000-000000000001'),
  ('u0000000-0000-0000-0000-000000000006', 'Farmer F (Dharman)', '+91 94441 11006', 'farmer.f@agriconnect.org', 'farmer', 'Vellore', 'Vellore', 12.9352, 79.1338, 'f0000000-0000-0000-0000-000000000001');

-- Users: Buyers
INSERT INTO users (id, name, phone, email, role, village, district, latitude, longitude, fpo_id)
VALUES
  ('u2000000-0000-0000-0000-000000000001', 'ABC Fresh Foods (Buyer 1)', '+91 99620 44551', 'procurement@abcfresh.com', 'buyer', 'Chennai Hub', 'Chennai', 13.0827, 80.2707, NULL),
  ('u2000000-0000-0000-0000-000000000002', 'Fresh Market Ltd (Buyer 2)', '+91 99620 44552', 'sourcing@freshmarket.com', 'buyer', 'Bangalore Hub', 'Bangalore', 12.9716, 77.5946, NULL);

-- Users: Logistics Partners
INSERT INTO users (id, name, phone, email, role, village, district, latitude, longitude, fpo_id)
VALUES
  ('u3000000-0000-0000-0000-000000000001', 'Quick Transport (Logistics 1)', '+91 98840 99881', 'dispatch@quicktransport.in', 'logistics', 'Kanchipuram Hub', 'Kanchipuram', 12.8342, 79.7036, NULL),
  ('u3000000-0000-0000-0000-000000000002', 'Rural Logistics (Logistics 2)', '+91 98840 99882', 'fleet@rurallogistics.in', 'logistics', 'Vellore Hub', 'Vellore', 12.9165, 79.1325, NULL);

-- Initial Farmer Listings (6 Total = 10,000 kg Tomato Grade A)
INSERT INTO farmer_listings (id, farmer_id, crop, quantity_kg, quality, ready_date, expected_price_per_kg, village, status)
VALUES
  ('l0000000-0000-0000-0000-000000000001', 'u0000000-0000-0000-0000-000000000001', 'Tomato', 2000, 'Grade A', CURRENT_DATE + INTERVAL '1 day', 24.00, 'Kanchipuram', 'listed'),
  ('l0000000-0000-0000-0000-000000000002', 'u0000000-0000-0000-0000-000000000002', 'Tomato', 1500, 'Grade A', CURRENT_DATE + INTERVAL '1 day', 24.00, 'Kanchipuram', 'listed'),
  ('l0000000-0000-0000-0000-000000000003', 'u0000000-0000-0000-0000-000000000003', 'Tomato', 2500, 'Grade A', CURRENT_DATE + INTERVAL '1 day', 23.50, 'Tiruvallur', 'listed'),
  ('l0000000-0000-0000-0000-000000000004', 'u0000000-0000-0000-0000-000000000004', 'Tomato', 1000, 'Grade A', CURRENT_DATE + INTERVAL '1 day', 24.50, 'Chengalpattu', 'listed'),
  ('l0000000-0000-0000-0000-000000000005', 'u0000000-0000-0000-0000-000000000005', 'Tomato', 1500, 'Grade A', CURRENT_DATE + INTERVAL '1 day', 24.00, 'Ranipet', 'listed'),
  ('l0000000-0000-0000-0000-000000000006', 'u0000000-0000-0000-0000-000000000006', 'Tomato', 1500, 'Grade A', CURRENT_DATE + INTERVAL '1 day', 23.00, 'Vellore', 'listed');

-- Buyer Demands
INSERT INTO buyer_demands (id, buyer_id, crop, required_quantity_kg, minimum_quality, maximum_price_per_kg, delivery_location, delivery_date, status)
VALUES
  ('d0000000-0000-0000-0000-000000000001', 'u2000000-0000-0000-0000-000000000001', 'Tomato', 10000, 'Grade A', 25.00, 'Chennai Wholesale Terminal', CURRENT_DATE + INTERVAL '2 days', 'open'),
  ('d0000000-0000-0000-0000-000000000002', 'u2000000-0000-0000-0000-000000000002', 'Tomato', 8000, 'Grade A', 24.00, 'Bangalore Central Hub', CURRENT_DATE + INTERVAL '3 days', 'open');

-- Mandi Prices (14 Days of Trend Data)
INSERT INTO mandi_prices (crop, date, price_per_kg, source)
VALUES
  ('Tomato', CURRENT_DATE - INTERVAL '13 days', 21.00, 'Koyambedu APMC'),
  ('Tomato', CURRENT_DATE - INTERVAL '12 days', 20.50, 'Koyambedu APMC'),
  ('Tomato', CURRENT_DATE - INTERVAL '11 days', 22.00, 'Koyambedu APMC'),
  ('Tomato', CURRENT_DATE - INTERVAL '10 days', 21.50, 'Koyambedu APMC'),
  ('Tomato', CURRENT_DATE - INTERVAL '9 days', 23.00, 'Koyambedu APMC'),
  ('Tomato', CURRENT_DATE - INTERVAL '8 days', 22.50, 'Koyambedu APMC'),
  ('Tomato', CURRENT_DATE - INTERVAL '7 days', 24.00, 'Koyambedu APMC'),
  ('Tomato', CURRENT_DATE - INTERVAL '6 days', 23.50, 'Koyambedu APMC'),
  ('Tomato', CURRENT_DATE - INTERVAL '5 days', 25.00, 'Koyambedu APMC'),
  ('Tomato', CURRENT_DATE - INTERVAL '4 days', 24.50, 'Koyambedu APMC'),
  ('Tomato', CURRENT_DATE - INTERVAL '3 days', 26.00, 'Koyambedu APMC'),
  ('Tomato', CURRENT_DATE - INTERVAL '2 days', 25.50, 'Koyambedu APMC'),
  ('Tomato', CURRENT_DATE - INTERVAL '1 days', 25.00, 'Koyambedu APMC'),
  ('Tomato', CURRENT_DATE, 25.50, 'Koyambedu APMC'),

  ('Onion', CURRENT_DATE - INTERVAL '6 days', 19.00, 'Koyambedu APMC'),
  ('Onion', CURRENT_DATE - INTERVAL '4 days', 20.50, 'Koyambedu APMC'),
  ('Onion', CURRENT_DATE - INTERVAL '2 days', 22.00, 'Koyambedu APMC'),
  ('Onion', CURRENT_DATE, 23.50, 'Koyambedu APMC'),

  ('Potato', CURRENT_DATE - INTERVAL '6 days', 13.00, 'Koyambedu APMC'),
  ('Potato', CURRENT_DATE - INTERVAL '4 days', 14.50, 'Koyambedu APMC'),
  ('Potato', CURRENT_DATE - INTERVAL '2 days', 15.00, 'Koyambedu APMC'),
  ('Potato', CURRENT_DATE, 15.50, 'Koyambedu APMC');
