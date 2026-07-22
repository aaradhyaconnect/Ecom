-- OTP codes for supplier login (bypasses Supabase SMTP)
CREATE TABLE IF NOT EXISTS supplier_otp_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supplier_otp_email ON supplier_otp_codes(email);
CREATE INDEX IF NOT EXISTS idx_supplier_otp_expires ON supplier_otp_codes(expires_at);

-- Auto-cleanup old OTPs
CREATE OR REPLACE FUNCTION cleanup_supplier_otps()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM supplier_otp_codes WHERE expires_at < NOW() - INTERVAL '1 hour';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
