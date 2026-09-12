-- Allow the 'closed' claim status (PR closed without merge).
ALTER TABLE claims DROP CONSTRAINT IF EXISTS claims_status_check;
ALTER TABLE claims ADD CONSTRAINT claims_status_check
  CHECK (status = ANY (ARRAY['claimed','submitted','merged','abandoned','closed']));
