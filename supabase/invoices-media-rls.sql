-- =====================================================
-- INVOICES — RLS policies for media purchase receipts
-- Run in: Supabase SQL Editor
-- =====================================================

-- Users can read their own invoices
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'invoices' AND policyname = 'Users read own invoices'
  ) THEN
    CREATE POLICY "Users read own invoices"
      ON invoices FOR SELECT
      USING (user_id = auth.uid());
  END IF;
END $$;

-- Admins can read all invoices
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'invoices' AND policyname = 'Admins full access to invoices'
  ) THEN
    CREATE POLICY "Admins full access to invoices"
      ON invoices FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.user_type = 'admin'
        )
      );
  END IF;
END $$;

-- Service role can insert (bypasses RLS, but explicit for clarity)
-- No policy needed: service_role key bypasses RLS automatically

-- Ensure RLS is enabled
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
