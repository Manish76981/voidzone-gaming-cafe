-- ============================================================================
-- VoidZone Gaming Cafe - Production Cloudflare D1 Relational Schema & Seed Data
-- Strict RBAC Architecture: Customer, Staff (PIN 1234), Owner (PIN 9999)
-- ============================================================================

PRAGMA foreign_keys = ON;

-- 1. Members Table (Player Authentication & Loyalty Vault)
CREATE TABLE IF NOT EXISTS members (
    id TEXT PRIMARY KEY,
    member_account TEXT NOT NULL UNIQUE COLLATE NOCASE,
    member_phone TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT DEFAULT '',
    riot_id TEXT DEFAULT '',
    pin_salt TEXT NOT NULL,
    pin_hash TEXT NOT NULL,
    pass_tier TEXT NOT NULL DEFAULT 'none' CHECK (pass_tier IN ('none', 'silver', 'gold', 'radiant')),
    pass_expires_at TEXT,
    wallet_balance REAL NOT NULL DEFAULT 0.0 CHECK (wallet_balance >= 0.0),
    bonus_hh_minutes INTEGER NOT NULL DEFAULT 0,
    spins_available INTEGER NOT NULL DEFAULT 1,
    drops_available INTEGER NOT NULL DEFAULT 0,
    shards_count INTEGER NOT NULL DEFAULT 0,
    cooler_coupons INTEGER NOT NULL DEFAULT 0,
    playtime_streak_days INTEGER NOT NULL DEFAULT 0,
    streak_shields INTEGER NOT NULL DEFAULT 1,
    kyc_verified INTEGER NOT NULL DEFAULT 0 CHECK (kyc_verified IN (0, 1)),
    kyc_doc_note TEXT DEFAULT 'Pending Desk KYC',
    visits INTEGER NOT NULL DEFAULT 0,
    total_hours REAL NOT NULL DEFAULT 0.0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 2. Auth Sessions Table (Hashed Session Tokens, CCBoot Context & RBAC Roles)
CREATE TABLE IF NOT EXISTS auth_sessions (
    token TEXT PRIMARY KEY,
    token_hash TEXT NOT NULL DEFAULT '',
    member_id TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'staff', 'owner', 'developer')),
    ccboot_operator_id TEXT NOT NULL DEFAULT '',
    ccboot_cafe_id TEXT NOT NULL DEFAULT '',
    ccboot_verified INTEGER NOT NULL DEFAULT 0 CHECK (ccboot_verified IN (0, 1)),
    auth_mode TEXT NOT NULL DEFAULT 'WEBSITE_CUSTOMER',
    permissions_json TEXT NOT NULL DEFAULT '[]',
    revoked INTEGER NOT NULL DEFAULT 0 CHECK (revoked IN (0, 1)),
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 3. Stations Table (Mazgaon Hardware Fleet: 16 PCs, 4 PS5s, 1 Racing Sim)
CREATE TABLE IF NOT EXISTS stations (
    id TEXT PRIMARY KEY,
    branch TEXT NOT NULL DEFAULT 'MAZGAON' CHECK (branch IN ('MAZGAON', 'CHARNI_ROAD')),
    station_type TEXT NOT NULL CHECK (station_type IN ('PC', 'PS5', 'SIM', 'VR')),
    rig_name TEXT NOT NULL,
    hardware_specs TEXT NOT NULL,
    hourly_rate_peak REAL NOT NULL,
    hourly_rate_hh REAL NOT NULL,
    live_status TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK (live_status IN ('AVAILABLE', 'OCCUPIED', 'RESERVED')),
    current_customer TEXT DEFAULT '—',
    session_start_ms INTEGER DEFAULT 0
);

-- 4. Master Log Table (Sheet 1 & Sheet 13: 21-Column Transactional & Floor History Ledger)
CREATE TABLE IF NOT EXISTS master_log (
    tx_id TEXT PRIMARY KEY,
    session_date TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    phone TEXT DEFAULT '',
    time_in TEXT DEFAULT '',
    time_out TEXT DEFAULT '',
    total_hr REAL NOT NULL DEFAULT 0.0,
    console_id TEXT DEFAULT '',
    category TEXT DEFAULT 'Standard',
    controllers INTEGER NOT NULL DEFAULT 1,
    game_charges REAL NOT NULL DEFAULT 0.0,
    snacks REAL NOT NULL DEFAULT 0.0,
    total_bill REAL NOT NULL DEFAULT 0.0,
    cash REAL NOT NULL DEFAULT 0.0,
    upi REAL NOT NULL DEFAULT 0.0,
    wallet REAL NOT NULL DEFAULT 0.0,
    total_received REAL NOT NULL DEFAULT 0.0,
    balance_due REAL NOT NULL DEFAULT 0.0,
    cash_given REAL NOT NULL DEFAULT 0.0,
    change_to_return REAL NOT NULL DEFAULT 0.0,
    wallet_status TEXT NOT NULL DEFAULT '✅ Paid',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_master_log_date ON master_log(session_date);
CREATE INDEX IF NOT EXISTS idx_master_log_console ON master_log(console_id, session_date, time_in, time_out);

-- 5. Snack Log Table (Sheet 2: Itemized F&B Sales)
CREATE TABLE IF NOT EXISTS snack_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tx_id TEXT NOT NULL,
    sale_date TEXT NOT NULL,
    snack_name TEXT NOT NULL,
    qty INTEGER NOT NULL DEFAULT 1,
    unit_price REAL NOT NULL,
    total_cost REAL NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 6. Inventory Table (Sheet 8: F&B Stock & Reorder Thresholds)
CREATE TABLE IF NOT EXISTS inventory (
    item_name TEXT PRIMARY KEY,
    sell_price REAL NOT NULL,
    total_purchased INTEGER NOT NULL DEFAULT 0,
    total_sold INTEGER NOT NULL DEFAULT 0,
    current_stock INTEGER NOT NULL DEFAULT 0,
    reorder_level INTEGER NOT NULL DEFAULT 10
);

-- 7. Wallet Top-Ups Table (Sheet 3 & Sheet 4: Deposits & Cash Bonus %)
CREATE TABLE IF NOT EXISTS wallet_topups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    deposit_date TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    phone TEXT DEFAULT '',
    amount_deposited REAL NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'UPI',
    bonus_pct REAL NOT NULL DEFAULT 0.0,
    bonus_amount REAL NOT NULL DEFAULT 0.0,
    total_credited REAL NOT NULL DEFAULT 0.0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 8. OpEx Ledger Table (Sheet 5 & Sheet 10: Operating Expenses)
CREATE TABLE IF NOT EXISTS opex_ledger (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    expense_date TEXT NOT NULL,
    expense_category TEXT NOT NULL,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 9. Customer Directory Table (Sheet 12: Customer Details Dashboard)
CREATE TABLE IF NOT EXISTS customer_directory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    membership_tier TEXT NOT NULL DEFAULT 'Non-Member',
    UNIQUE(customer_name, phone)
);

-- ============================================================================
-- Seed Data from Master_Calculator_Hardened.xlsx
-- ============================================================================

INSERT OR IGNORE INTO stations (id, branch, station_type, rig_name, hardware_specs, hourly_rate_peak, hourly_rate_hh) VALUES
('PC-1', 'MAZGAON', 'PC', 'Rig 01 [VIP Alpha]', 'i5-14400F · RTX 4060 · 32GB DDR5 · 240Hz Zowie', 80.0, 60.0),
('PC-2', 'MAZGAON', 'PC', 'Rig 02 [VIP Bravo]', 'i5-14400F · RTX 4060 · 32GB DDR5 · 240Hz Zowie', 80.0, 60.0),
('PC-3', 'MAZGAON', 'PC', 'Rig 03 [Stage Main]', 'i5-14400F · RTX 4060 · 32GB DDR5 · 240Hz Zowie', 80.0, 60.0),
('PC-4', 'MAZGAON', 'PC', 'Rig 04 [Stage Wing]', 'i5-14400F · RTX 4060 · 32GB DDR5 · 240Hz Zowie', 80.0, 60.0),
('PC-5', 'MAZGAON', 'PC', 'Rig 05 [Stage Mid]', 'i5-14400F · RTX 4060 · 32GB DDR5 · 240Hz Zowie', 80.0, 60.0),
('PC-6', 'MAZGAON', 'PC', 'Rig 06 [Stage Anchor]', 'i5-14400F · RTX 4060 · 32GB DDR5 · 240Hz Zowie', 80.0, 60.0),
('PC-7', 'MAZGAON', 'PC', 'Rig 07 [Arena A1]', 'i5-14400F · RTX 4060 · 32GB DDR5 · 180Hz BenQ', 80.0, 60.0),
('PC-8', 'MAZGAON', 'PC', 'Rig 08 [Arena A2]', 'i5-14400F · RTX 4060 · 32GB DDR5 · 180Hz BenQ', 80.0, 60.0),
('PC-9', 'MAZGAON', 'PC', 'Rig 09 [Arena A3]', 'i5-14400F · RTX 4060 · 32GB DDR5 · 180Hz BenQ', 80.0, 60.0),
('PC-10', 'MAZGAON', 'PC', 'Rig 10 [Arena A4]', 'i5-14400F · RTX 4060 · 32GB DDR5 · 180Hz BenQ', 80.0, 60.0),
('PC-11', 'MAZGAON', 'PC', 'Rig 11 [Squad B1]', 'i5-14400F · RTX 4060 · 32GB DDR5 · 165Hz Asus', 80.0, 60.0),
('PC-12', 'MAZGAON', 'PC', 'Rig 12 [Squad B2]', 'i5-14400F · RTX 4060 · 32GB DDR5 · 165Hz Asus', 80.0, 60.0),
('PC-13', 'MAZGAON', 'PC', 'Rig 13 [Squad B3]', 'i5-14400F · RTX 4060 · 32GB DDR5 · 165Hz Asus', 80.0, 60.0),
('PC-14', 'MAZGAON', 'PC', 'Rig 14 [Squad B4]', 'i5-14400F · RTX 4060 · 32GB DDR5 · 165Hz Asus', 80.0, 60.0),
('PC-15', 'MAZGAON', 'PC', 'Rig 15 [Squad B5]', 'i5-14400F · RTX 4060 · 32GB DDR5 · 165Hz Asus', 80.0, 60.0),
('PC-16', 'MAZGAON', 'PC', 'Rig 16 [Streamer Pod]', 'i5-14400F · RTX 4060 · Dual 240Hz · Shure Mic', 80.0, 60.0),
('PC-17', 'MAZGAON', 'PC', 'Rig 17 [Squad B6]', 'i5-14400F · RTX 4060 · 32GB DDR5 · 165Hz Asus', 80.0, 60.0),
('PS-1', 'MAZGAON', 'PS5', 'PS5 Lounge Pod 1', 'Sony PS5 · 55" 4K OLED 120Hz · 4x DualSense', 100.0, 80.0),
('PS-2', 'MAZGAON', 'PS5', 'PS5 Lounge Pod 2', 'Sony PS5 · 55" 4K OLED 120Hz · 4x DualSense', 100.0, 80.0),
('PS-3', 'MAZGAON', 'PS5', 'PS5 Private Pod 3', 'Sony PS5 · 65" Sony Bravia 120Hz · 4x DualSense Edge', 100.0, 80.0),
('PS-4', 'MAZGAON', 'PS5', 'PS5 Arena Pod 4', 'Sony PS5 · 55" Samsung Neo QLED · 4x DualSense', 100.0, 80.0),
('SIM-1', 'MAZGAON', 'SIM', 'Racing Simulator Cockpit', 'Fanatec Podium DD2 · ClubSport V3 · Triple 32" + PSVR2', 200.0, 150.0);

INSERT OR IGNORE INTO members (id, member_account, member_phone, full_name, email, riot_id, pin_salt, pin_hash, pass_tier, wallet_balance, playtime_streak_days, kyc_verified, kyc_doc_note) VALUES
('ICF-1001', 'rahul_vz', '9820011223', 'Rahul', 'rahul.esports@gmail.com', 'Rahul#VZ01', 'vz_9820011223', '0000', 'none', 1880.0, 4, 1, 'Aadhaar Last-4 (4821)'),
('ICF-1002', 'manish_vz', '9819397166', 'manish', 'manishjaryan@gmail.com', 'manish#VZ02', 'vz_9819397166', '0000', 'silver', 400.0, 3, 1, 'College ID Verified'),
('ICF-1003', 'amit_vz', '9820044556', 'Amit', 'amit@gmail.com', 'Amit#VZ03', 'vz_9820044556', '0000', 'none', 0.0, 1, 0, 'Pending Desk KYC'),
('ICF-1004', 'suresh_vz', '9833011221', 'Suresh', 'suresh@gmail.com', 'Suresh#VZ04', 'vz_9833011221', '0000', 'none', 0.0, 1, 0, 'Pending Desk KYC'),
('ICF-1005', 'group_a', '9800000001', 'Group_A', 'groupa@gmail.com', 'GroupA#VZ05', 'vz_9800000001', '0000', 'none', 0.0, 1, 1, 'Tournament Squad'),
('ICF-1006', 'player_5', '9800000002', 'Player_5', 'player5@gmail.com', 'Player5#VZ06', 'vz_9800000002', '0000', 'none', 0.0, 1, 0, 'Pending Desk KYC'),
('ICF-1007', 'makdn_vz', '4864548845', 'Makdn', 'makdn@gmail.com', 'Makdn#VZ07', 'vz_4864548845', '0000', 'none', 0.0, 1, 0, 'Pending Desk KYC'),
('ICF-1008', 'manish_2', '9819394511', 'manish', 'manish2@gmail.com', 'manish#VZ08', 'vz_9819394511', '0000', 'none', 0.0, 1, 0, 'Pending Desk KYC');

INSERT OR IGNORE INTO master_log (tx_id, session_date, customer_name, phone, time_in, time_out, total_hr, console_id, category, controllers, game_charges, snacks, total_bill, cash, upi, wallet, total_received, balance_due, cash_given, change_to_return, wallet_status) VALUES
('20260318001', '2026-03-18', 'Rahul', '9820011223', '11:20:00', '16:20:00', 5.0, 'PC-1', 'Split Time', 0, 350.0, 120.0, 470.0, 0.0, 0.0, 120.0, 120.0, 350.0, 0.0, 0.0, '✅ Paid'),
('20260321001', '2026-03-21', 'manish', '9819397166', '00:33:00', '02:33:00', 2.0, 'PC-3', 'Standard', 1, 160.0, 0.0, 160.0, 120.0, 40.0, 0.0, 160.0, 0.0, 120.0, 0.0, '✅ Paid'),
('20260321002', '2026-03-21', 'rahul', '9820011223', '10:12:00', '12:05:00', 1.8833, 'PS-1', 'Happy Hr', 4, 640.0, 0.0, 640.0, 500.0, 140.0, 0.0, 640.0, 0.0, 500.0, 0.0, '✅ Paid'),
('20260322001', '2026-03-22', 'manish', '', '', '', 0.0, '', '', 0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, '✅ Paid'),
('20260313001', '2026-03-13', 'rahul', '9820011223', '00:33:00', '02:33:00', 2.0, 'PC-5', 'Standard', 1, 160.0, 0.0, 160.0, 0.0, 0.0, 0.0, 0.0, 160.0, 0.0, 0.0, '✅ Paid'),
('20260321003', '2026-03-21', 'manish', '', '', '', 0.0, 'PS-3', '', 0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, '✅ Paid');

INSERT OR IGNORE INTO snack_log (tx_id, sale_date, snack_name, qty, unit_price, total_cost) VALUES
('20260318001', '2026-03-18', 'Maggi', 2, 60.0, 120.0);

INSERT OR IGNORE INTO inventory (item_name, sell_price, total_purchased, total_sold, current_stock, reorder_level) VALUES
('diet coke', 50.0, 100, 0, 100, 20),
('Maggi', 60.0, 50, 2, 48, 10);

INSERT OR IGNORE INTO wallet_topups (deposit_date, customer_name, phone, amount_deposited, payment_method, bonus_pct, bonus_amount, total_credited) VALUES
('2026-03-18', 'Rahul', '9820011223', 2000.0, 'UPI', 0.0, 0.0, 2000.0);

INSERT OR IGNORE INTO opex_ledger (expense_date, expense_category, description, amount) VALUES
('2026-03-18', 'Electricity', 'Commercial Power', 25000.0);

INSERT OR IGNORE INTO customer_directory (customer_name, phone, membership_tier) VALUES
('Rahul', '9820011223', 'Tier 1'),
('manish', '9819397166', 'Non-Member'),
('manish', 'No Phone', 'Non-Member'),
('Amit', '9820044556', 'Non-Member'),
('Suresh', '9833011221', 'Non-Member'),
('Group_A', '9800000001', 'Non-Member'),
('Player_5', '9800000002', 'Non-Member'),
('Makdn', '4864548845', 'Non-Member'),
('manish', '9819394511', 'Non-Member');

-- 10. CASH_DRAWER_LEDGER TABLE (Physical Till Count & Shift Variance Snapshots)
CREATE TABLE IF NOT EXISTS cash_drawer_ledger (
  id TEXT PRIMARY KEY,
  snapshot_ts TEXT NOT NULL,
  staff_id TEXT NOT NULL DEFAULT 'STAFF_1234',
  opening_float REAL NOT NULL DEFAULT 2000,
  cash_received REAL NOT NULL DEFAULT 0,
  cash_payouts REAL NOT NULL DEFAULT 0,
  physical_cash REAL NOT NULL DEFAULT 0,
  expected_cash REAL NOT NULL DEFAULT 0,
  discrepancy REAL NOT NULL DEFAULT 0,
  notes_json TEXT NOT NULL DEFAULT '{}',
  notes_remark TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_cash_drawer_ts ON cash_drawer_ledger(snapshot_ts);

-- SEED CASH DRAWER SHIFT SNAPSHOT
INSERT OR IGNORE INTO cash_drawer_ledger (id, snapshot_ts, staff_id, opening_float, cash_received, cash_payouts, physical_cash, expected_cash, discrepancy, notes_json, notes_remark)
VALUES ('TILL-20260318-01', '2026-03-18 23:55:00', 'STAFF_1234', 2000, 120, 0, 2120, 2120, 0, '{"500":2,"200":2,"100":5,"50":2,"20":4,"10":2,"5":2,"2":3,"1":4}', 'Shift handover balanced.');


-- ============================================================================
-- 11. CMS SETTINGS TABLE (Published & Draft Website Identity, Theme, Pricing & Content)
-- ============================================================================
CREATE TABLE IF NOT EXISTS cms_settings (
  config_key TEXT PRIMARY KEY,
  published_json TEXT NOT NULL DEFAULT '{}',
  draft_json TEXT NOT NULL DEFAULT '{}',
  version_num INTEGER NOT NULL DEFAULT 1,
  updated_by TEXT NOT NULL DEFAULT 'DEV_ADMIN',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================================
-- 12. CMS VERSION HISTORY TABLE (Snapshots for 1-Click Rollback)
-- ============================================================================
CREATE TABLE IF NOT EXISTS cms_versions (
  version_id INTEGER PRIMARY KEY AUTOINCREMENT,
  version_label TEXT NOT NULL,
  snapshot_json TEXT NOT NULL,
  published_by TEXT NOT NULL DEFAULT 'DEV_ADMIN',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================================
-- 13. CMS OFFERS & PROMOTIONS TABLE (Server-Enforced Coupons & Discounts)
-- ============================================================================
CREATE TABLE IF NOT EXISTS cms_offers (
  code TEXT PRIMARY KEY COLLATE NOCASE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  discount_type TEXT NOT NULL DEFAULT 'PERCENT' CHECK (discount_type IN ('PERCENT', 'FLAT')),
  discount_value REAL NOT NULL DEFAULT 10.0,
  min_bill REAL NOT NULL DEFAULT 0.0,
  max_discount REAL NOT NULL DEFAULT 500.0,
  eligible_service TEXT NOT NULL DEFAULT 'ALL',
  start_date TEXT NOT NULL DEFAULT '2026-01-01',
  end_date TEXT NOT NULL DEFAULT '2027-12-31',
  usage_limit INTEGER NOT NULL DEFAULT 100,
  used_count INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  featured INTEGER NOT NULL DEFAULT 1 CHECK (featured IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================================
-- 14. CMS DEVELOPER AUDIT LOG TABLE (Security & Configuration Activity History)
-- ============================================================================
CREATE TABLE IF NOT EXISTS cms_audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor TEXT NOT NULL,
  action_type TEXT NOT NULL,
  target_key TEXT NOT NULL,
  summary TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO cms_offers (code, title, description, discount_type, discount_value, min_bill, max_discount, eligible_service, start_date, end_date, usage_limit, used_count, active, featured) VALUES
('VOID20', 'Launch 20% Off Promo', '20% off any PC, PS5, or Sim booking (up to ₹200)', 'PERCENT', 20.0, 100.0, 200.0, 'ALL', '2026-01-01', '2027-12-31', 500, 0, 1, 1),
('SQUAD50', 'Flat ₹50 Off Squad Session', 'Flat ₹50 off bookings of ₹250 or more', 'FLAT', 50.0, 250.0, 50.0, 'ALL', '2026-01-01', '2027-12-31', 200, 0, 1, 0);


-- ============================================================================
-- 15. CCBOOT / ICAFECLOUD INTEGRATION CONFIGURATION TABLE (Two-Mode Architecture)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ccboot_config (
  config_key TEXT PRIMARY KEY,
  operating_mode TEXT NOT NULL DEFAULT 'STANDALONE' CHECK (operating_mode IN ('STANDALONE', 'CCBOOT_INTEGRATION')),
  cp_portal_url TEXT NOT NULL DEFAULT 'https://cp.icafecloud.com',
  api_base_url TEXT NOT NULL DEFAULT 'https://api.icafecloud.com',
  cafe_id TEXT NOT NULL DEFAULT '',
  api_token_masked TEXT NOT NULL DEFAULT '',
  has_token INTEGER NOT NULL DEFAULT 0 CHECK (has_token IN (0, 1)),
  timeout_ms INTEGER NOT NULL DEFAULT 5000,
  max_retries INTEGER NOT NULL DEFAULT 2,
  feature_flags_json TEXT NOT NULL DEFAULT '{"enableConnection":false,"syncClientStatus":true,"syncPcInfo":true,"syncMaintenanceStatus":true,"syncManagementReporting":false}',
  connection_status TEXT NOT NULL DEFAULT 'STANDALONE_ACTIVE',
  last_sync_at TEXT DEFAULT '',
  last_error TEXT DEFAULT '',
  updated_by TEXT NOT NULL DEFAULT 'DEV_ADMIN',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO ccboot_config (
  config_key, operating_mode, cp_portal_url, api_base_url, cafe_id, api_token_masked, has_token, timeout_ms, max_retries, connection_status
) VALUES (
  'main', 'STANDALONE', 'https://cp.icafecloud.com', 'https://api.icafecloud.com', '', '', 0, 5000, 2, 'STANDALONE_ACTIVE'
);

-- ============================================================================
-- 16. GAMING PC & CONSOLE INFRASTRUCTURE INVENTORY TABLE (Standalone + CCBoot Sync)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ccboot_pcs (
  station_id TEXT PRIMARY KEY,
  zone_name TEXT NOT NULL DEFAULT 'Pro Esports Zone',
  console_type TEXT NOT NULL DEFAULT 'PC' CHECK (console_type IN ('PC', 'PS5', 'SIM')),
  ip_address TEXT NOT NULL DEFAULT '192.168.10.101',
  mac_address TEXT NOT NULL DEFAULT '00-E0-4C-68-01-01',
  hardware_profile TEXT NOT NULL DEFAULT 'Intel Core i5-14400F · RTX 4060 8GB · 16GB DDR5 · 240Hz',
  boot_mode TEXT NOT NULL DEFAULT 'LOCAL_NVME' CHECK (boot_mode IN ('LOCAL_NVME', 'PXE_ISCSI', 'HYBRID', 'CONSOLE_OS')),
  boot_image_name TEXT NOT NULL DEFAULT 'VZ-Win11-24H2-Esports-v4.vhd',
  writeback_status TEXT NOT NULL DEFAULT 'HEALTHY (Local NVMe)',
  installed_games_json TEXT NOT NULL DEFAULT '["Valorant 9.08","CS2 1.40.4","Dota 2 7.37d","Apex Legends S22","GTA V"]',
  maintenance_status TEXT NOT NULL DEFAULT 'OPERATIONAL' CHECK (maintenance_status IN ('OPERATIONAL', 'MAINTENANCE', 'LOGIN_LOCKED')),
  issue_notes TEXT NOT NULL DEFAULT '',
  ccboot_online INTEGER NOT NULL DEFAULT 0 CHECK (ccboot_online IN (0, 1)),
  last_maintained_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO ccboot_pcs (station_id, zone_name, console_type, ip_address, mac_address, hardware_profile, boot_mode, boot_image_name, writeback_status, maintenance_status) VALUES
('PC-1',  'Pro Arena Row A', 'PC',  '192.168.10.101', '5A-9A-9B-26-01-01', 'i5-14400F · RTX 4060 · 16GB DDR5 · 240Hz Zowie', 'LOCAL_NVME', 'VZ-Win11-24H2-Esports-v4.vhd', 'HEALTHY', 'OPERATIONAL'),
('PC-2',  'Pro Arena Row A', 'PC',  '192.168.10.102', '5A-9A-9B-26-01-02', 'i5-14400F · RTX 4060 · 16GB DDR5 · 240Hz Zowie', 'LOCAL_NVME', 'VZ-Win11-24H2-Esports-v4.vhd', 'HEALTHY', 'OPERATIONAL'),
('PC-3',  'Pro Arena Row A', 'PC',  '192.168.10.103', '5A-9A-9B-26-01-03', 'i5-14400F · RTX 4060 · 16GB DDR5 · 240Hz Zowie', 'LOCAL_NVME', 'VZ-Win11-24H2-Esports-v4.vhd', 'HEALTHY', 'OPERATIONAL'),
('PC-4',  'Pro Arena Row A', 'PC',  '192.168.10.104', '5A-9A-9B-26-01-04', 'i5-14400F · RTX 4060 · 16GB DDR5 · 240Hz Zowie', 'LOCAL_NVME', 'VZ-Win11-24H2-Esports-v4.vhd', 'HEALTHY', 'OPERATIONAL'),
('PC-5',  'Pro Arena Row A', 'PC',  '192.168.10.105', '5A-9A-9B-26-01-05', 'i5-14400F · RTX 4060 · 16GB DDR5 · 240Hz Zowie', 'LOCAL_NVME', 'VZ-Win11-24H2-Esports-v4.vhd', 'HEALTHY', 'OPERATIONAL'),
('PC-6',  'Pro Arena Row B', 'PC',  '192.168.10.106', '5A-9A-9B-26-01-06', 'i5-14400F · RTX 4060 · 16GB DDR5 · 240Hz Zowie', 'LOCAL_NVME', 'VZ-Win11-24H2-Esports-v4.vhd', 'HEALTHY', 'OPERATIONAL'),
('PC-7',  'Pro Arena Row B', 'PC',  '192.168.10.107', '5A-9A-9B-26-01-07', 'i5-14400F · RTX 4060 · 16GB DDR5 · 240Hz Zowie', 'LOCAL_NVME', 'VZ-Win11-24H2-Esports-v4.vhd', 'HEALTHY', 'OPERATIONAL'),
('PC-8',  'Squad 5v5 Pod',   'PC',  '192.168.10.108', '5A-9A-9B-26-01-08', 'i5-14400F · RTX 4060 · 16GB DDR5 · 240Hz BenQ',  'LOCAL_NVME', 'VZ-Win11-24H2-Esports-v4.vhd', 'HEALTHY', 'OPERATIONAL'),
('PC-9',  'Squad 5v5 Pod',   'PC',  '192.168.10.109', '5A-9A-9B-26-01-09', 'i5-14400F · RTX 4060 · 16GB DDR5 · 240Hz BenQ',  'LOCAL_NVME', 'VZ-Win11-24H2-Esports-v4.vhd', 'HEALTHY', 'OPERATIONAL'),
('PC-10', 'Squad 5v5 Pod',   'PC',  '192.168.10.110', '5A-9A-9B-26-01-10', 'i5-14400F · RTX 4060 · 16GB DDR5 · 240Hz BenQ',  'LOCAL_NVME', 'VZ-Win11-24H2-Esports-v4.vhd', 'HEALTHY', 'OPERATIONAL'),
('PC-11', 'Squad 5v5 Pod',   'PC',  '192.168.10.111', '5A-9A-9B-26-01-11', 'i5-14400F · RTX 4060 · 16GB DDR5 · 240Hz BenQ',  'LOCAL_NVME', 'VZ-Win11-24H2-Esports-v4.vhd', 'HEALTHY', 'OPERATIONAL'),
('PC-12', 'Squad 5v5 Pod',   'PC',  '192.168.10.112', '5A-9A-9B-26-01-12', 'i5-14400F · RTX 4060 · 16GB DDR5 · 240Hz BenQ',  'LOCAL_NVME', 'VZ-Win11-24H2-Esports-v4.vhd', 'HEALTHY', 'OPERATIONAL'),
('PC-13', 'Squad 5v5 Pod',   'PC',  '192.168.10.113', '5A-9A-9B-26-01-13', 'i5-14400F · RTX 4060 · 16GB DDR5 · 240Hz BenQ',  'LOCAL_NVME', 'VZ-Win11-24H2-Esports-v4.vhd', 'HEALTHY', 'OPERATIONAL'),
('PC-14', 'Squad 5v5 Pod',   'PC',  '192.168.10.114', '5A-9A-9B-26-01-14', 'i5-14400F · RTX 4060 · 16GB DDR5 · 240Hz BenQ',  'LOCAL_NVME', 'VZ-Win11-24H2-Esports-v4.vhd', 'HEALTHY', 'OPERATIONAL'),
('PC-15', 'Squad 5v5 Pod',   'PC',  '192.168.10.115', '5A-9A-9B-26-01-15', 'i5-14400F · RTX 4060 · 16GB DDR5 · 240Hz BenQ',  'LOCAL_NVME', 'VZ-Win11-24H2-Esports-v4.vhd', 'HEALTHY', 'OPERATIONAL'),
('PC-16', 'Squad 5v5 Pod',   'PC',  '192.168.10.116', '5A-9A-9B-26-01-16', 'i5-14400F · RTX 4060 · 16GB DDR5 · 240Hz BenQ',  'LOCAL_NVME', 'VZ-Win11-24H2-Esports-v4.vhd', 'HEALTHY', 'OPERATIONAL'),
('PC-17', 'Squad 5v5 Pod',   'PC',  '192.168.10.117', '5A-9A-9B-26-01-17', 'i5-14400F · RTX 4060 · 16GB DDR5 · 240Hz BenQ',  'LOCAL_NVME', 'VZ-Win11-24H2-Esports-v4.vhd', 'HEALTHY', 'OPERATIONAL'),
('PS-1',  'PS5 Bean Bag Lounge', 'PS5', '192.168.10.201', '7C-BB-8A-11-02-01', 'Sony PlayStation 5 Disc · 4K 120Hz OLED · 4 DualSense', 'CONSOLE_OS', 'PS5-System-FW-Latest', 'HEALTHY', 'OPERATIONAL'),
('PS-2',  'PS5 Bean Bag Lounge', 'PS5', '192.168.10.202', '7C-BB-8A-11-02-02', 'Sony PlayStation 5 Disc · 4K 120Hz OLED · 4 DualSense', 'CONSOLE_OS', 'PS5-System-FW-Latest', 'HEALTHY', 'OPERATIONAL'),
('PS-3',  'PS5 Bean Bag Lounge', 'PS5', '192.168.10.203', '7C-BB-8A-11-02-03', 'Sony PlayStation 5 Disc · 4K 120Hz OLED · 4 DualSense', 'CONSOLE_OS', 'PS5-System-FW-Latest', 'HEALTHY', 'OPERATIONAL'),
('PS-4',  'PS5 Bean Bag Lounge', 'PS5', '192.168.10.204', '7C-BB-8A-11-02-04', 'Sony PlayStation 5 Disc · 4K 120Hz OLED · 4 DualSense', 'CONSOLE_OS', 'PS5-System-FW-Latest', 'HEALTHY', 'OPERATIONAL'),
('SIM-1', 'Racing Sim Cockpit',  'SIM', '192.168.10.210', '7C-BB-8A-11-03-01', 'GT-Racer Cockpit · Force-Feedback Wheel + Pedals + PS VR2', 'CONSOLE_OS', 'PS5-GT7-VR2-Build', 'HEALTHY', 'OPERATIONAL');

-- ============================================================================
-- 17. CCBOOT / ICAFECLOUD INTEGRATION & INFRASTRUCTURE TELEMETRY LOG TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS ccboot_sync_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  operating_mode TEXT NOT NULL DEFAULT 'STANDALONE',
  endpoint TEXT NOT NULL DEFAULT 'LOCAL',
  status_code INTEGER NOT NULL DEFAULT 200,
  latency_ms INTEGER NOT NULL DEFAULT 0,
  summary TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);


-- ============================================================================
-- 18. CCBOOT OPERATOR LINKS & APPLICATION RBAC TABLE (CCBoot-First Auth Gateway)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ccboot_operator_links (
  ccboot_operator_id TEXT PRIMARY KEY COLLATE NOCASE,
  cafe_id TEXT NOT NULL DEFAULT '7777',
  pass_salt TEXT NOT NULL DEFAULT 'vz_ccboot_op_salt_v8',
  pass_hash TEXT NOT NULL,
  linked_member_id TEXT NOT NULL DEFAULT '',
  app_username TEXT NOT NULL DEFAULT '',
  assigned_role TEXT NOT NULL DEFAULT 'unlinked' CHECK (assigned_role IN ('staff', 'owner', 'developer', 'unlinked')),
  permissions_json TEXT NOT NULL DEFAULT '[]',
  is_linked INTEGER NOT NULL DEFAULT 0 CHECK (is_linked IN (0, 1)),
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO ccboot_operator_links (
  ccboot_operator_id, cafe_id, pass_salt, pass_hash, linked_member_id, app_username, assigned_role, permissions_json, is_linked, active
) VALUES
('ccboot_staff_mazgaon', '7777', 'vz_ccboot_op_salt_v8', 'ccboot_staff_2026', 'VZ-OP-STAFF-01', 'mazgaon_floor_staff', 'staff', '["floor_pos","bookings","inventory","cash_drawer","ccboot_read"]', 1, 1),
('ccboot_owner_manish',  '7777', 'vz_ccboot_op_salt_v8', 'ccboot_owner_2026', 'VZ-OP-OWNER-01', 'manish_owner',        'owner', '["floor_pos","bookings","inventory","cash_drawer","owner_pnl","opex","excel_export","ccboot_read"]', 1, 1),
('ccboot_dev_arch',      '7777', 'vz_ccboot_op_salt_v8', 'ccboot_dev_2026',   'VZ-OP-DEV-01',   'admin_dev',           'developer', '["cms_full","ccboot_bridge","infra_admin","owner_pnl","floor_pos"]', 1, 1),
('ccboot_unlinked_op',   '7777', 'vz_ccboot_op_salt_v8', 'ccboot_unlinked_2026', '',            '',                    'unlinked', '[]', 0, 1);


-- ============================================================================
-- 19. ESPORTS TOURNAMENTS, ACADEMY & CREATOR STUDIO ECOSYSTEM TABLE (v9.0)
-- ============================================================================
CREATE TABLE IF NOT EXISTS esports_ecosystem (
  id TEXT PRIMARY KEY,
  vertical_type TEXT NOT NULL CHECK (vertical_type IN ('TOURNAMENT', 'ACADEMY', 'CREATOR_STUDIO')),
  title TEXT NOT NULL,
  game_or_track TEXT NOT NULL,
  schedule_label TEXT NOT NULL,
  fee_inr REAL NOT NULL DEFAULT 0.0,
  prize_or_benefit TEXT NOT NULL DEFAULT '',
  slots_total INTEGER NOT NULL DEFAULT 16,
  slots_filled INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'FULL', 'COMPLETED')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO esports_ecosystem (id, vertical_type, title, game_or_track, schedule_label, fee_inr, prize_or_benefit, slots_total, slots_filled, status) VALUES
('ESP-VALO-01', 'TOURNAMENT',     'VoidZone Mumbai 5v5 Valorant LAN Cup', 'Valorant (Riot Direct <5ms)', 'Every Sunday · 2:00 PM IST', 500.0, '₹25,000 Prize Pool + Radiant Shards', 16, 12, 'OPEN'),
('ESP-CS2-02',  'TOURNAMENT',     'CS2 2v2 Wingman Premier Showdown',      'Counter-Strike 2 (240Hz Zowie)', 'Every Friday · 6:00 PM IST', 200.0, '₹10,000 Prize Pool + Free HH Pass', 16, 10, 'OPEN'),
('ACA-AIM-01',  'ACADEMY',        'Radiant FPS Mechanics & VOD Bootcamp',  'Valorant & CS2 Pro Coaching', 'Tue / Thu / Sat · 4:00 PM – 6:00 PM', 999.0, '1-on-1 Immortal/Radiant Coach + Cert', 10, 6, 'OPEN'),
('CRE-POD-01',  'CREATOR_STUDIO', 'Dual-PC 4K60 Creator & Streamer Booth', 'OBS Studio + Elgato 4K + Shure SM7B', 'Daily · 10:00 AM – 2:00 AM', 250.0, 'Isolated Acoustic Pod + Fiber Upload', 4, 1, 'OPEN');

-- ============================================================================
-- COMPOSITE PERFORMANCE INDEXES (v9.0 Database Audit Remediation)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_auth_sessions_lookup ON auth_sessions(token_hash, revoked, expires_at);
CREATE INDEX IF NOT EXISTS idx_members_account ON members(member_account);
CREATE INDEX IF NOT EXISTS idx_snack_log_date_tx ON snack_log(sale_date, tx_id);
CREATE INDEX IF NOT EXISTS idx_wallet_topups_date_phone ON wallet_topups(deposit_date, phone);
CREATE INDEX IF NOT EXISTS idx_opex_ledger_date ON opex_ledger(expense_date);
CREATE INDEX IF NOT EXISTS idx_ccboot_pcs_maint ON ccboot_pcs(maintenance_status);


-- ============================================================================
-- 20. COMMUNITY POSTS TABLE (Feed, Discussions, Achievements & Announcements)
-- ============================================================================
CREATE TABLE IF NOT EXISTS community_posts (
  post_id TEXT PRIMARY KEY,
  author_phone TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_handle TEXT NOT NULL,
  post_type TEXT NOT NULL DEFAULT 'Text' CHECK (post_type IN ('Text', 'Image', 'Video', 'Achievement', 'Tournament', 'Event', 'Team', 'Creator', 'Collaboration', 'Announcement')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  media_url TEXT DEFAULT '',
  game_tag TEXT DEFAULT 'Valorant',
  is_sponsored INTEGER NOT NULL DEFAULT 0 CHECK (is_sponsored IN (0, 1)),
  content_origin TEXT NOT NULL DEFAULT 'User-Generated' CHECK (content_origin IN ('User-Generated', 'Verified', 'Sponsored', 'Official VOIDZONE')),
  likes_count INTEGER NOT NULL DEFAULT 0,
  comments_json TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'PUBLISHED' CHECK (status IN ('PUBLISHED', 'UNDER_REVIEW', 'REMOVED')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================================
-- 21. COMMUNITY IDEAS & SUGGESTIONS TABLE (Voting & Status Roadmap)
-- ============================================================================
CREATE TABLE IF NOT EXISTS community_ideas (
  idea_id TEXT PRIMARY KEY,
  author_phone TEXT NOT NULL,
  author_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Game Request', 'Tournament Idea', 'Event Idea', 'Academy Idea', 'Creator Idea', 'Cafe Improvement', 'Hardware Suggestion', 'Community Feature', 'Sponsorship Concept')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  votes_count INTEGER NOT NULL DEFAULT 1,
  voters_json TEXT NOT NULL DEFAULT '[]',
  comments_json TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'Submitted' CHECK (status IN ('Submitted', 'Under Review', 'Planned', 'In Development', 'Implemented', 'Declined', 'Duplicate')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================================
-- 22. COMMUNITY CHALLENGES TABLE (Configurable Rules, Scoring & Rewards)
-- ============================================================================
CREATE TABLE IF NOT EXISTS community_challenges (
  challenge_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  game TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Gameplay',
  rules_text TEXT NOT NULL,
  reward_label TEXT NOT NULL,
  sponsor_brand TEXT DEFAULT '',
  participants_count INTEGER NOT NULL DEFAULT 0,
  leaderboard_json TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'UPCOMING', 'COMPLETED')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================================
-- 23. TOURNAMENT TEAMS & SQUAD ROSTERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS tournament_teams (
  team_id TEXT PRIMARY KEY,
  team_name TEXT NOT NULL UNIQUE,
  team_tag TEXT NOT NULL,
  primary_game TEXT NOT NULL DEFAULT 'Valorant',
  captain_phone TEXT NOT NULL,
  captain_name TEXT NOT NULL,
  members_json TEXT NOT NULL DEFAULT '[]',
  substitutes_json TEXT NOT NULL DEFAULT '[]',
  seeking_roles_json TEXT NOT NULL DEFAULT '["Sponsor","Player"]',
  wins INTEGER NOT NULL DEFAULT 0,
  points INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================================
-- 24. PLAYER DISCOVERY & OPPORTUNITY PROFILES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS player_discovery_profiles (
  member_phone TEXT PRIMARY KEY,
  gamer_tag TEXT NOT NULL,
  display_name TEXT NOT NULL,
  primary_game TEXT NOT NULL DEFAULT 'Valorant',
  skill_level TEXT NOT NULL DEFAULT 'Diamond / Immortal',
  preferred_role TEXT NOT NULL DEFAULT 'Duelist / Entry',
  play_mode TEXT NOT NULL DEFAULT 'Competitive',
  region TEXT NOT NULL DEFAULT 'Mumbai (South / Central)',
  availability TEXT NOT NULL DEFAULT 'Evenings & Weekends',
  looking_for TEXT NOT NULL DEFAULT '5v5 Tournament Squad & Scrims',
  public_visible INTEGER NOT NULL DEFAULT 1 CHECK (public_visible IN (0, 1)),
  reputation_score INTEGER NOT NULL DEFAULT 100,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================================
-- 25. CANONICAL SOCIAL CONTENT TABLE (Lazy Embeds & Platform Classification)
-- ============================================================================
CREATE TABLE IF NOT EXISTS social_content (
  content_id TEXT PRIMARY KEY,
  platform TEXT NOT NULL CHECK (platform IN ('Instagram Reel', 'Instagram Post', 'YouTube Video', 'YouTube Short', 'Kick Stream', 'Twitch Stream', 'Gaming Clip', 'Event Photo')),
  integration_mode TEXT NOT NULL CHECK (integration_mode IN ('Official Embed', 'External Link', 'Manual Import')),
  external_url TEXT NOT NULL,
  title TEXT NOT NULL,
  caption TEXT NOT NULL DEFAULT '',
  creator_handle TEXT NOT NULL,
  game TEXT NOT NULL DEFAULT 'Valorant',
  category TEXT NOT NULL DEFAULT 'Tournament Highlight',
  content_badge TEXT NOT NULL DEFAULT 'Verified' CHECK (content_badge IN ('User-Generated', 'Verified', 'Sponsored', 'Official VOIDZONE')),
  likes_count INTEGER NOT NULL DEFAULT 0,
  featured INTEGER NOT NULL DEFAULT 0 CHECK (featured IN (0, 1)),
  status TEXT NOT NULL DEFAULT 'PUBLISHED' CHECK (status IN ('PUBLISHED', 'PENDING_MODERATION', 'REMOVED')),
  published_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================================
-- 26. CREATOR PROFILES, MEDIA KITS & PORTFOLIOS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS creator_profiles (
  creator_id TEXT PRIMARY KEY,
  member_phone TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  handle TEXT NOT NULL,
  creator_category TEXT NOT NULL DEFAULT 'Streamer & Content Creator',
  bio TEXT NOT NULL,
  games_json TEXT NOT NULL DEFAULT '["Valorant","CS2","GTA V"]',
  platforms_json TEXT NOT NULL DEFAULT '["YouTube","Instagram","Kick"]',
  youtube_url TEXT DEFAULT '',
  instagram_url TEXT DEFAULT '',
  kick_url TEXT DEFAULT '',
  twitch_url TEXT DEFAULT '',
  followers_total INTEGER NOT NULL DEFAULT 0,
  avg_views INTEGER NOT NULL DEFAULT 0,
  engagement_pct REAL NOT NULL DEFAULT 0.0,
  metrics_classification TEXT NOT NULL DEFAULT 'Creator Submitted' CHECK (metrics_classification IN ('Verified', 'Creator Submitted', 'Estimated')),
  location_region TEXT NOT NULL DEFAULT 'Mumbai, IN',
  languages_json TEXT NOT NULL DEFAULT '["English","Hindi","Marathi"]',
  collab_interests_json TEXT NOT NULL DEFAULT '["Brand Campaigns","Tournament Streams","Creator Collabs"]',
  portfolio_json TEXT NOT NULL DEFAULT '[]',
  private_rate_card_inr REAL NOT NULL DEFAULT 0.0,
  expose_rates_public INTEGER NOT NULL DEFAULT 0 CHECK (expose_rates_public IN (0, 1)),
  verification_status TEXT NOT NULL DEFAULT 'Unverified' CHECK (verification_status IN ('Unverified', 'Profile Verified', 'Creator Verified', 'Professional Creator', 'VOIDZONE Creator Partner')),
  reputation_score INTEGER NOT NULL DEFAULT 100,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================================
-- 27. BRAND PROFILES & B2B VERIFICATION TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS brand_profiles (
  brand_id TEXT PRIMARY KEY,
  owner_phone TEXT NOT NULL,
  brand_name TEXT NOT NULL UNIQUE,
  industry TEXT NOT NULL DEFAULT 'Gaming Hardware & Peripherals',
  website_url TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL,
  products_summary TEXT NOT NULL DEFAULT '',
  target_audience TEXT NOT NULL DEFAULT '16-30 Esports & PC/PS5 Gamers',
  geography TEXT NOT NULL DEFAULT 'Mumbai / All-India',
  campaign_interests_json TEXT NOT NULL DEFAULT '["Tournament Sponsorship","Sponsored Reels","Cafe Station Branding"]',
  preferred_games_json TEXT NOT NULL DEFAULT '["Valorant","CS2","EA FC 25"]',
  preferred_platforms_json TEXT NOT NULL DEFAULT '["Instagram","YouTube","Kick"]',
  private_budget_range TEXT NOT NULL DEFAULT '₹25,000 – ₹1,50,000 (Private)',
  verification_status TEXT NOT NULL DEFAULT 'Unverified' CHECK (verification_status IN ('Unverified', 'Business Verified', 'Brand Verified', 'VOIDZONE Partner', 'Strategic Partner')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================================
-- 28. INFLUENCER & CREATOR COLLABORATION OPPORTUNITIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS collaboration_opportunities (
  collab_id TEXT PRIMARY KEY,
  organizer_phone TEXT NOT NULL,
  organizer_name TEXT NOT NULL,
  title TEXT NOT NULL,
  collab_type TEXT NOT NULL CHECK (collab_type IN ('Creator + Creator', 'Creator + Player', 'Creator + Team', 'Creator + Academy', 'Creator + VOIDZONE', 'Creator + Brand', 'Creator + Event', 'Creator + Tournament')),
  category_tag TEXT NOT NULL DEFAULT 'Content Collaboration',
  game TEXT NOT NULL DEFAULT 'Valorant',
  platform TEXT NOT NULL DEFAULT 'YouTube & Instagram',
  description TEXT NOT NULL,
  required_creator_type TEXT NOT NULL DEFAULT 'FPS Streamer / Caster / Reel Creator',
  required_audience TEXT NOT NULL DEFAULT '1,000+ Followers or Active Local Community',
  expected_deliverables TEXT NOT NULL DEFAULT '1 Instagram Reel + 1 Co-Stream Session',
  timeline TEXT NOT NULL DEFAULT 'This Weekend',
  location_mode TEXT NOT NULL DEFAULT 'Hybrid (VoidZone Mazgaon + Online)',
  compensation_type TEXT NOT NULL DEFAULT 'Paid + Free Rig Hours / Revenue Share',
  budget_inr REAL NOT NULL DEFAULT 0.0,
  deadline TEXT NOT NULL DEFAULT '2026-12-31',
  status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Draft', 'Open', 'Applications Open', 'Shortlisting', 'Negotiation', 'Accepted', 'In Progress', 'Completed', 'Cancelled')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================================
-- 29. BRAND CAMPAIGNS TABLE (B2B Sponsored Campaigns & Activations)
-- ============================================================================
CREATE TABLE IF NOT EXISTS brand_campaigns (
  campaign_id TEXT PRIMARY KEY,
  brand_id TEXT NOT NULL,
  brand_name TEXT NOT NULL,
  campaign_name TEXT NOT NULL,
  campaign_type TEXT NOT NULL,
  objective TEXT NOT NULL,
  game TEXT NOT NULL DEFAULT 'Valorant',
  target_audience TEXT NOT NULL DEFAULT 'Mumbai Competitive PC & PS5 Gamers',
  creator_category TEXT NOT NULL DEFAULT 'Esports Streamers & Reel Creators',
  platform TEXT NOT NULL DEFAULT 'Instagram & YouTube',
  deliverables_spec TEXT NOT NULL DEFAULT '1 Instagram Reel + 2 Stories + 1 Tournament Shoutout',
  creators_needed INTEGER NOT NULL DEFAULT 3,
  start_date TEXT NOT NULL DEFAULT '2026-11-10',
  end_date TEXT NOT NULL DEFAULT '2026-12-15',
  deadline TEXT NOT NULL DEFAULT '2026-11-25',
  location_mode TEXT NOT NULL DEFAULT 'VoidZone Mazgaon & Online',
  budget_inr REAL NOT NULL DEFAULT 25000.0,
  compensation_type TEXT NOT NULL DEFAULT 'Fixed Payout + Product Seeding',
  usage_rights TEXT NOT NULL DEFAULT '30-Day Co-Branded Social Amplification',
  brief TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Applications Open' CHECK (status IN ('Draft', 'Open', 'Applications Open', 'Shortlisting', 'Negotiation', 'Accepted', 'In Progress', 'Completed', 'Cancelled')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================================
-- 30. COLLABORATION APPLICATIONS, AGREEMENTS & DELIVERABLE TRACKING TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS collaboration_applications (
  app_id TEXT PRIMARY KEY,
  target_kind TEXT NOT NULL CHECK (target_kind IN ('COLLAB', 'CAMPAIGN')),
  target_id TEXT NOT NULL,
  target_title TEXT NOT NULL,
  applicant_phone TEXT NOT NULL,
  applicant_name TEXT NOT NULL,
  applicant_handle TEXT NOT NULL,
  pitch_note TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Submitted' CHECK (status IN ('Submitted', 'Under Review', 'Shortlisted', 'Negotiation', 'Accepted', 'Rejected', 'Withdrawn')),
  deliverables_json TEXT NOT NULL DEFAULT '[{"item":"1 Instagram Reel","status":"Pending"},{"item":"1 YouTube Short","status":"Pending"}]',
  agreement_accepted INTEGER NOT NULL DEFAULT 0 CHECK (agreement_accepted IN (0, 1)),
  reported_views INTEGER NOT NULL DEFAULT 0,
  metrics_badge TEXT NOT NULL DEFAULT 'Creator Submitted' CHECK (metrics_badge IN ('Verified', 'Creator Submitted', 'Estimated')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================================
-- 31. SPONSORSHIP INVENTORY & CONFIGURABLE PACKAGES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS sponsorship_inventory (
  asset_id TEXT PRIMARY KEY,
  asset_name TEXT NOT NULL,
  package_tier TEXT NOT NULL CHECK (package_tier IN ('Starter', 'Growth', 'Tournament', 'Premium', 'Strategic Partner')),
  description TEXT NOT NULL,
  audience_reach TEXT NOT NULL,
  duration_label TEXT NOT NULL DEFAULT '30 Days / 1 Event Cycle',
  price_inr REAL NOT NULL DEFAULT 15000.0,
  availability TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK (availability IN ('AVAILABLE', 'RESERVED', 'SOLD_OUT')),
  deliverables_summary TEXT NOT NULL,
  terms_summary TEXT NOT NULL DEFAULT 'Standard VoidZone Co-Branded Sponsorship Terms',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================================
-- 32. CAMPUS PARTNERSHIPS, AMBASSADORS, CREATOR SERVICES & MODERATION TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS ecosystem_programs_and_moderation (
  record_id TEXT PRIMARY KEY,
  record_type TEXT NOT NULL CHECK (record_type IN ('CAMPUS_PARTNERSHIP', 'AMBASSADOR_PROGRAM', 'PLAYER_OPPORTUNITY', 'CREATOR_SERVICE', 'MODERATION_REPORT', 'COLLAB_MESSAGE', 'NOTIFICATION')),
  actor_phone TEXT NOT NULL,
  actor_name TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  details_json TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_comm_posts_created ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_platform_game ON social_content(platform, game);
CREATE INDEX IF NOT EXISTS idx_creator_verif ON creator_profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_collab_status_game ON collaboration_opportunities(status, game);
CREATE INDEX IF NOT EXISTS idx_campaigns_status_game ON brand_campaigns(status, game);
CREATE INDEX IF NOT EXISTS idx_collab_apps_applicant ON collaboration_applications(applicant_phone, target_id);

-- ============================================================================
-- PHASE 17 (v16.0): ADVANCED MULTI-RESOURCE BOOKING PLATFORM TABLES
-- ============================================================================
CREATE TABLE IF NOT EXISTS booking_resources (
  resource_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  category TEXT NOT NULL,
  group_zone TEXT NOT NULL,
  branch TEXT NOT NULL DEFAULT 'MAZGAON',
  capacity INTEGER NOT NULL DEFAULT 1,
  min_duration_mins INTEGER NOT NULL DEFAULT 30,
  max_duration_mins INTEGER NOT NULL DEFAULT 480,
  buffer_mins INTEGER NOT NULL DEFAULT 0,
  base_rate_peak INTEGER NOT NULL DEFAULT 80,
  base_rate_offpeak INTEGER NOT NULL DEFAULT 60,
  features_json TEXT NOT NULL DEFAULT '[]',
  supported_games_json TEXT NOT NULL DEFAULT '[]',
  maintenance_status TEXT NOT NULL DEFAULT 'OPERATIONAL',
  maintenance_reason TEXT DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS booking_packages (
  package_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  resources_spec_json TEXT NOT NULL,
  duration_hrs REAL NOT NULL DEFAULT 2,
  discount_pct REAL NOT NULL DEFAULT 10,
  min_players INTEGER NOT NULL DEFAULT 1,
  max_players INTEGER NOT NULL DEFAULT 10,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS booking_addons (
  addon_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price_inr INTEGER NOT NULL,
  max_qty INTEGER NOT NULL DEFAULT 10,
  tax_pct REAL NOT NULL DEFAULT 0,
  eligible_types_json TEXT NOT NULL DEFAULT '["pc","ps","sim","vr"]',
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS multi_bookings (
  booking_id TEXT PRIMARY KEY,
  customer_phone TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  branch TEXT NOT NULL DEFAULT 'MAZGAON',
  session_date TEXT NOT NULL,
  booking_status TEXT NOT NULL DEFAULT 'Confirmed',
  payment_status TEXT NOT NULL DEFAULT 'Pending Payment',
  subtotal_inr INTEGER NOT NULL DEFAULT 0,
  discount_inr INTEGER NOT NULL DEFAULT 0,
  addons_inr INTEGER NOT NULL DEFAULT 0,
  tax_inr INTEGER NOT NULL DEFAULT 0,
  total_inr INTEGER NOT NULL DEFAULT 0,
  package_id TEXT DEFAULT NULL,
  promo_code TEXT DEFAULT NULL,
  player_count INTEGER NOT NULL DEFAULT 1,
  team_name TEXT DEFAULT '',
  participants_json TEXT NOT NULL DEFAULT '[]',
  addons_json TEXT NOT NULL DEFAULT '[]',
  checkin_code TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_multi_bookings_date_phone ON multi_bookings(session_date, customer_phone);

CREATE TABLE IF NOT EXISTS multi_booking_items (
  item_id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  session_date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  duration_hrs REAL NOT NULL DEFAULT 2,
  buffer_mins INTEGER NOT NULL DEFAULT 0,
  unit_rate_inr INTEGER NOT NULL DEFAULT 80,
  item_total_inr INTEGER NOT NULL DEFAULT 160,
  status TEXT NOT NULL DEFAULT 'Confirmed',
  FOREIGN KEY (booking_id) REFERENCES multi_bookings(booking_id)
);

CREATE INDEX IF NOT EXISTS idx_multi_booking_items_lookup ON multi_booking_items(session_date, resource_id, start_time, end_time);

CREATE TABLE IF NOT EXISTS booking_waitlist (
  waitlist_id TEXT PRIMARY KEY,
  customer_phone TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  group_zone TEXT NOT NULL,
  session_date TEXT NOT NULL,
  requested_start TEXT NOT NULL,
  requested_end TEXT NOT NULL,
  player_count INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'Waiting',
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS booking_audit_log (
  audit_id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  action TEXT NOT NULL,
  before_json TEXT DEFAULT '{}',
  after_json TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
