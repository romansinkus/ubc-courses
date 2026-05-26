-- Defer username choice until after first sign-in.

ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "username_set_at" timestamptz;

-- Existing accounts already have usernames; don't prompt them again.
UPDATE "profiles" SET "username_set_at" = "created_at" WHERE "username_set_at" IS NULL;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  suffix INT := 0;
  chosen_username TEXT;
  username_is_chosen BOOLEAN := false;
BEGIN
  chosen_username := NULLIF(trim(NEW.raw_user_meta_data->>'username'), '');

  IF chosen_username IS NOT NULL THEN
    base_username := lower(regexp_replace(chosen_username, '[^a-zA-Z0-9_]+', '_', 'g'));
    IF length(base_username) >= 3 THEN
      final_username := base_username;
      WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
        suffix := suffix + 1;
        final_username := base_username || suffix::text;
      END LOOP;
      username_is_chosen := true;
    END IF;
  END IF;

  IF NOT username_is_chosen THEN
    final_username := 'pending_' || substr(replace(NEW.id::text, '-', ''), 1, 12);
  END IF;

  INSERT INTO public.profiles (id, username, display_name, username_set_at)
  VALUES (
    NEW.id,
    final_username,
    NEW.raw_user_meta_data->>'display_name',
    CASE WHEN username_is_chosen THEN now() ELSE NULL END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
