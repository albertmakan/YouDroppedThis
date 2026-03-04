


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "app";


ALTER SCHEMA "app" OWNER TO "postgres";


CREATE TYPE "app"."transaction_type" AS ENUM (
    'drop_fee',
    'collection_reward',
    'daily_grant',
    'host_reward',
    'canvas_creation',
    'purchase'
);


ALTER TYPE "app"."transaction_type" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "app"."broadcast_area_cleared"(
  p_canvas_id bigint,
  p_min_x int,
  p_max_x int,
  p_min_y int,
  p_max_y int
) RETURNS void
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  perform realtime.send(
    jsonb_build_object(
      'minX', p_min_x,
      'maxX', p_max_x,
      'minY', p_min_y,
      'maxY', p_max_y
    ),
    'area_cleared',
    'canvas:' || p_canvas_id,
    TRUE
  );
end;
$$;

CREATE OR REPLACE FUNCTION "app"."artwork_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  event_type text;
  event_payload jsonb;
  profile_info jsonb;
begin
  -- Determine event type and build custom payload
  if (TG_OP = 'INSERT') then
    -- Placement event - send full artwork data
    event_type := 'placed';

    if NEW.created_by is not null then
      -- Fetch creator profile info for authenticated users
      SELECT jsonb_build_object('username', p.username, 'profile_picture', p.profile_picture)
      INTO profile_info
      FROM app.profiles p
      WHERE p.id = NEW.created_by;

      event_payload := to_jsonb(NEW) || jsonb_build_object('creator', profile_info);
    else
      -- Anonymous placement, attach guest metadata instead
      event_payload := to_jsonb(NEW) || jsonb_build_object(
        'creator',
        jsonb_build_object('username', NEW.guest_name, 'profile_picture', NULL)
      );
    end if;
    
  elsif (TG_OP = 'UPDATE' and OLD.collected_at is null and NEW.collected_at is not null) then
    -- Collection event - send minimal data
    event_type := 'collected';
    -- Fetch collector profile info
    SELECT jsonb_build_object('username', p.username, 'profile_picture', p.profile_picture)
    INTO profile_info
    FROM app.profiles p
    WHERE p.id = NEW.collected_by;
    event_payload := jsonb_build_object(
      'id', NEW.id,
      'x', NEW.x,
      'y', NEW.y,
      'collected_by', NEW.collected_by,
      'collected_at', NEW.collected_at,
      'collector', profile_info
    );
    
  else
    -- Ignore other updates (like marking expired)
    return null;
  end if;

  -- Broadcast the event
  perform realtime.send(
    event_payload,
    event_type,
    'canvas:' || NEW.canvas_id,
    TRUE
  );
  
  return null;
end;
$$;


ALTER FUNCTION "app"."artwork_changes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "app"."close_canvases"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$BEGIN
UPDATE app.canvases
SET accepting_artworks = FALSE
WHERE accepting_artworks = TRUE
  AND end_at <= NOW();
END;$$;


ALTER FUNCTION "app"."close_canvases"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "app"."expire_artworks"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$BEGIN
UPDATE app.artworks 
SET is_expired = TRUE 
WHERE expires_at <= NOW() 
  AND is_expired = FALSE 
  AND collected_at IS NULL;
END;$$;


ALTER FUNCTION "app"."expire_artworks"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "app"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$BEGIN
  -- Create user profile
  INSERT INTO app.profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  );
  
  RETURN NEW;
END;$$;


ALTER FUNCTION "app"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION app.initialize_artwork_counts()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update canvas counts
  UPDATE app.canvases c
  SET 
    total_artworks_placed = COALESCE(counts.total, 0),
    active_artworks_count = COALESCE(counts.active, 0),
    total_artworks_collected = COALESCE(counts.collected, 0)
  FROM (
    SELECT 
      a.canvas_id,
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE a.expires_at > NOW()) as active,
      COUNT(*) FILTER (WHERE a.collected_at IS NOT NULL) as collected
    FROM app.artworks a
    GROUP BY a.canvas_id
  ) counts
  WHERE c.id = counts.canvas_id;
  
  -- Update profile placed counts
  UPDATE app.profiles p
  SET artworks_placed_count = COALESCE(placed.count, 0)
  FROM (
    SELECT 
      created_by,
      COUNT(*) as count
    FROM app.artworks
    GROUP BY created_by
  ) placed
  WHERE p.id = placed.created_by;

  -- Update profile collected counts
  UPDATE app.profiles p
  SET artworks_collected_count = COALESCE(collected.count, 0)
  FROM (
    SELECT 
      collected_by,
      COUNT(*) as count
    FROM app.artworks
    WHERE collected_by IS NOT NULL
    GROUP BY collected_by
  ) collected
  WHERE p.id = collected.collected_by;

  RAISE NOTICE 'Artwork counts initialized successfully';
END;$$;


ALTER FUNCTION "app"."initialize_artwork_counts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "app"."update_artwork_stats_on_collect"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$BEGIN
  IF OLD.collected_by IS NULL AND NEW.collected_by IS NOT NULL THEN
    
    -- Update collector's stats
    UPDATE app.profiles
    SET artworks_collected_count = artworks_collected_count + 1,
        last_collected_at = NOW()
    WHERE id = NEW.collected_by;

        -- Update canvas stats
    UPDATE app.canvases
    SET active_artworks_count = active_artworks_count - 1,
        total_artworks_collected = total_artworks_collected + 1
    WHERE id = NEW.canvas_id;
    
  END IF;
  
  RETURN NEW;
END;$$;


ALTER FUNCTION "app"."update_artwork_stats_on_collect"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "app"."update_artwork_stats_on_place"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$BEGIN
  -- Update user's placed count
  UPDATE app.profiles
  SET artworks_placed_count = artworks_placed_count + 1,
      last_placed_at = NOW()
  WHERE id = NEW.created_by;
  
  -- Update canvas stats
  UPDATE app.canvases
  SET total_artworks_placed = total_artworks_placed + 1,
      active_artworks_count = active_artworks_count + 1,
      first_artwork_at = COALESCE(first_artwork_at, NOW()),
      last_artwork_at = NOW(),
      end_at = NOW() + interval '1 minute' * (artwork_expiry_minutes + 5)
  WHERE id = NEW.canvas_id;
  
  RETURN NEW;
END;$$;


ALTER FUNCTION "app"."update_artwork_stats_on_place"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "app"."update_stats_on_expire"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$BEGIN
  IF OLD.is_expired = FALSE AND NEW.is_expired = TRUE THEN
    
    -- Update canvas stats
    UPDATE app.canvases
    SET active_artworks_count = active_artworks_count - 1
    WHERE id = NEW.canvas_id;
    
  END IF;
  
  RETURN NEW;
END;$$;


ALTER FUNCTION "app"."update_stats_on_expire"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "app"."update_user_balance_on_transaction"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$BEGIN
  -- Update user balance
  UPDATE app.profiles
  SET balance = balance + NEW.amount
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;$$;


ALTER FUNCTION "app"."update_user_balance_on_transaction"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "app"."artworks" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "canvas_id" bigint NOT NULL,
    "x" integer NOT NULL,
    "y" integer NOT NULL,
    "pixel_data" "jsonb" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "collectable_after" timestamp with time zone,
    "collected_at" timestamp with time zone,
    "is_expired" boolean DEFAULT false,
    "created_by" "uuid",
    "collected_by" "uuid",
    "guest_name" text,
    "guest_session_id" uuid
);


ALTER TABLE "app"."artworks" OWNER TO "postgres";


ALTER TABLE "app"."artworks" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "app"."artworks_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "app"."canvases" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" character varying NOT NULL,
    "accepting_artworks" boolean DEFAULT true,
    "placement_fee" integer DEFAULT 10,
    "artwork_expiry_minutes" integer DEFAULT (24 * 60),
    "max_artworks_per_user_per_hour" integer DEFAULT 5,
    "min_x" integer NOT NULL,
    "max_x" integer NOT NULL,
    "min_y" integer NOT NULL,
    "max_y" integer NOT NULL,
    "description" "text",
    "background_color" character varying,
    "palette" "text"[],
    "min_visibility_minutes" integer DEFAULT 1,
    "first_artwork_at" timestamp with time zone,
    "last_artwork_at" timestamp with time zone,
    "created_by" "uuid",
    "artwork_resolution" integer DEFAULT 16 NOT NULL,
    "reward_claimed_at" timestamp with time zone,
    "end_at" timestamp with time zone,
    "total_artworks_placed" bigint DEFAULT '0'::bigint NOT NULL,
    "total_artworks_collected" bigint DEFAULT '0'::bigint NOT NULL,
    "active_artworks_count" bigint DEFAULT '0'::bigint NOT NULL,
    "allow_anonymous_placement" boolean DEFAULT false NOT NULL
);


ALTER TABLE "app"."canvases" OWNER TO "postgres";


ALTER TABLE "app"."canvases" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "app"."canvases_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "app"."profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "username" character varying NOT NULL,
    "profile_picture" "jsonb",
    "balance" integer DEFAULT 0 NOT NULL,
    "artworks_placed_count" integer DEFAULT 0,
    "artworks_collected_count" integer DEFAULT 0,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "last_placed_at" timestamp with time zone,
    "last_collected_at" timestamp with time zone,
    "bio" "text",
    CONSTRAINT "username_format" CHECK ((("username")::"text" ~ '^[a-zA-Z0-9_]{3,20}$'::"text"))
);


ALTER TABLE "app"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "app"."transactions" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "type" "app"."transaction_type" NOT NULL,
    "amount" integer NOT NULL,
    "artwork_id" bigint,
    "user_id" "uuid" NOT NULL,
    "canvas_id" bigint
);


ALTER TABLE "app"."transactions" OWNER TO "postgres";


ALTER TABLE "app"."transactions" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "app"."transactions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE ONLY "app"."artworks"
    ADD CONSTRAINT "artworks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "app"."canvases"
    ADD CONSTRAINT "canvases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "app"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "app"."profiles"
    ADD CONSTRAINT "profiles_username_key" UNIQUE ("username");



ALTER TABLE ONLY "app"."transactions"
    ADD CONSTRAINT "transactions_pkey" PRIMARY KEY ("id");



CREATE INDEX "artworks_canvas_id_collected_by_collected_at_idx" ON "app"."artworks" USING "btree" ("canvas_id", "collected_by", "collected_at" DESC) WHERE ("collected_at" IS NOT NULL);



CREATE INDEX "artworks_canvas_id_created_by_created_at_idx" ON "app"."artworks" USING "btree" ("canvas_id", "created_by", "created_at" DESC);



CREATE INDEX "artworks_collected_by_collected_at_idx" ON "app"."artworks" USING "btree" ("collected_by", "collected_at" DESC) WHERE ("collected_at" IS NOT NULL);



CREATE INDEX "artworks_expires_at_idx" ON "app"."artworks" USING "btree" ("expires_at") WHERE (("is_expired" = false) AND ("collected_at" IS NULL));



CREATE INDEX "artworks_user_id_created_at_idx" ON "app"."artworks" USING "btree" ("created_by", "created_at" DESC) WHERE ("created_by" IS NOT NULL);



CREATE INDEX "artworks_guest_session_id_created_at_idx" ON "app"."artworks" USING "btree" ("guest_session_id", "created_at" DESC) WHERE ("guest_session_id" IS NOT NULL);



CREATE INDEX "canvases_created_by_created_at_idx" ON "app"."canvases" USING "btree" ("created_by", "created_at" DESC);



CREATE INDEX "canvases_end_at_idx" ON "app"."canvases" USING "btree" ("end_at" DESC) WHERE ("accepting_artworks" = true);



CREATE INDEX "transactions_user_id_created_at_idx" ON "app"."transactions" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "transactions_canvas_id_type_idx" ON "app"."transactions" USING "btree" ("canvas_id", "type") WHERE ("canvas_id" IS NOT NULL);



CREATE UNIQUE INDEX "unique_active_artwork_position" ON "app"."artworks" USING "btree" ("canvas_id", "x", "y") WHERE (("is_expired" = false) AND ("collected_at" IS NULL));



CREATE OR REPLACE TRIGGER "handle_artwork_changes" AFTER INSERT OR UPDATE ON "app"."artworks" FOR EACH ROW EXECUTE FUNCTION "app"."artwork_changes"();



CREATE OR REPLACE TRIGGER "on_artwork_collected" AFTER UPDATE OF "collected_by" ON "app"."artworks" FOR EACH ROW EXECUTE FUNCTION "app"."update_artwork_stats_on_collect"();



CREATE OR REPLACE TRIGGER "on_artwork_expired" AFTER UPDATE OF "is_expired" ON "app"."artworks" FOR EACH ROW EXECUTE FUNCTION "app"."update_stats_on_expire"();



CREATE OR REPLACE TRIGGER "on_artwork_placed" AFTER INSERT ON "app"."artworks" FOR EACH ROW EXECUTE FUNCTION "app"."update_artwork_stats_on_place"();



CREATE OR REPLACE TRIGGER "on_transaction_insert" AFTER INSERT ON "app"."transactions" FOR EACH ROW EXECUTE FUNCTION "app"."update_user_balance_on_transaction"();



CREATE OR REPLACE TRIGGER "on_auth_user_created" AFTER INSERT ON "auth"."users" FOR EACH ROW EXECUTE FUNCTION "app"."handle_new_user"();



ALTER TABLE ONLY "app"."artworks"
    ADD CONSTRAINT "artworks_canvas_id_fkey" FOREIGN KEY ("canvas_id") REFERENCES "app"."canvases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "app"."artworks"
    ADD CONSTRAINT "artworks_collected_by_fkey" FOREIGN KEY ("collected_by") REFERENCES "app"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "app"."artworks"
    ADD CONSTRAINT "artworks_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "app"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "app"."canvases"
    ADD CONSTRAINT "canvases_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "app"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "app"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "app"."transactions"
    ADD CONSTRAINT "transactions_artwork_id_fkey" FOREIGN KEY ("artwork_id") REFERENCES "app"."artworks"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "app"."transactions"
    ADD CONSTRAINT "transactions_canvas_id_fkey" FOREIGN KEY ("canvas_id") REFERENCES "app"."canvases"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "app"."transactions"
    ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE "app"."artworks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "app"."canvases" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "app"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "app"."transactions" ENABLE ROW LEVEL SECURITY;



alter policy "authenticated can receive broadcasts"
on "realtime"."messages"
to anon, authenticated
using (true);


SELECT cron.schedule('mark-expired', '* * * * *', 'SELECT app.expire_artworks()');


SELECT cron.schedule('close-canvases', '*/30 * * * *', 'SELECT app.close_canvases()');

RESET ALL;


-- npx supabase db dump -f .\schema.sql -s app --local
