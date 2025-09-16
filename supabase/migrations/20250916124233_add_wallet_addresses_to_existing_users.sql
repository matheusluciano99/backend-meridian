-- =====================================================
-- MIGRATION: Add wallet addresses to existing users
-- Date: 2025-09-16
-- =====================================================

-- Update existing users with wallet addresses for testing
-- These are test Stellar addresses (56 characters, starting with G)

UPDATE users SET wallet_address = 'GABC1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789AB' WHERE id = '550e8400-e29b-41d4-a716-446655440001' AND wallet_address IS NULL;
UPDATE users SET wallet_address = 'GDEF9876543210ZYXWVUTSRQPONMLKJIHGFEDCBA0123456789' WHERE id = '550e8400-e29b-41d4-a716-446655440002' AND wallet_address IS NULL;
UPDATE users SET wallet_address = 'GHIJ1111222233334444555566667777888899990000111122' WHERE id = '550e8400-e29b-41d4-a716-446655440003' AND wallet_address IS NULL;
UPDATE users SET wallet_address = 'GKLN5555666677778888999900001111222233334444555566' WHERE id = '550e8400-e29b-41d4-a716-446655440004' AND wallet_address IS NULL;
UPDATE users SET wallet_address = 'GMNO9999888877776666555544443333222211110000999988' WHERE id = '550e8400-e29b-41d4-a716-446655440005' AND wallet_address IS NULL;
UPDATE users SET wallet_address = 'GPQR4444555566667777888899990000111122223333444455' WHERE id = '550e8400-e29b-41d4-a716-446655440006' AND wallet_address IS NULL;
UPDATE users SET wallet_address = 'GSTU3333444455556666777788889999000011112222333344' WHERE id = '550e8400-e29b-41d4-a716-446655440007' AND wallet_address IS NULL;
UPDATE users SET wallet_address = 'GVWX2222333344445555666677778888999900001111222233' WHERE id = '550e8400-e29b-41d4-a716-446655440008' AND wallet_address IS NULL;
UPDATE users SET wallet_address = 'GYZA1111222233334444555566667777888899990000111122' WHERE id = '550e8400-e29b-41d4-a716-446655440009' AND wallet_address IS NULL;
UPDATE users SET wallet_address = 'GZAB0000111122223333444455556666777788889999000011' WHERE id = '550e8400-e29b-41d4-a716-446655440010' AND wallet_address IS NULL;

-- For any other users without wallet_address, assign a valid 56-character test address
UPDATE users SET wallet_address = 'GTEST' || UPPER(SUBSTRING(MD5(id::text), 1, 51)) WHERE wallet_address IS NULL OR LENGTH(wallet_address) != 56;