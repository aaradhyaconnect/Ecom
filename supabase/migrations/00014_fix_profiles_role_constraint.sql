-- Fix profiles role check constraint to allow staff/super_admin roles
-- The auth trigger copies user_metadata.role into profiles, but the old constraint
-- only allowed 'customer' and 'admin', which breaks staff user creation

-- Step 1: Clean up any invalid roles (set them to 'customer')
UPDATE profiles SET role = 'customer' WHERE role NOT IN ('customer', 'admin', 'staff', 'super_admin');

-- Step 2: Drop old constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Step 3: Add new constraint with all valid roles
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('customer', 'admin', 'staff', 'super_admin'));
