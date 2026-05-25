-- Supabase-specific: tie profiles.id to auth.users(id), enable RLS,
-- and create a trigger that inserts a profile row on signup.

ALTER TABLE "profiles"
  ADD CONSTRAINT "profiles_id_auth_users_fk"
  FOREIGN KEY ("id") REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "courses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "reviews" ENABLE ROW LEVEL SECURITY;

-- Profiles: world-readable, only the owner can update.
CREATE POLICY "profiles_select_all" ON "profiles"
  FOR SELECT USING (true);

CREATE POLICY "profiles_update_own" ON "profiles"
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Courses: world-readable. Writes happen via service role (seed/admin).
CREATE POLICY "courses_select_all" ON "courses"
  FOR SELECT USING (true);

-- Reviews: world-readable. Owner can insert/update/delete.
CREATE POLICY "reviews_select_all" ON "reviews"
  FOR SELECT USING (true);

CREATE POLICY "reviews_insert_own" ON "reviews"
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reviews_update_own" ON "reviews"
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reviews_delete_own" ON "reviews"
  FOR DELETE USING (auth.uid() = user_id);

-- Auto-create a profile row whenever a new auth user is created.
-- The username comes from raw_user_meta_data.username supplied at sign-up.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  suffix INT := 0;
BEGIN
  base_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    split_part(NEW.email, '@', 1)
  );
  -- Sanitize: lowercase, replace non-alphanumeric with underscore.
  base_username := lower(regexp_replace(base_username, '[^a-zA-Z0-9_]+', '_', 'g'));
  IF length(base_username) < 3 THEN
    base_username := 'user_' || substr(NEW.id::text, 1, 8);
  END IF;
  final_username := base_username;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    suffix := suffix + 1;
    final_username := base_username || suffix::text;
  END LOOP;

  INSERT INTO public.profiles (id, username, display_name)
  VALUES (NEW.id, final_username, NEW.raw_user_meta_data->>'display_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
