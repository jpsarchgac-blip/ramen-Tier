-- ラーメンTier データベーススキーマ
-- このファイルは何度実行しても安全です（べき等）

-- ============================
-- テーブル
-- ============================

-- 組織
CREATE TABLE IF NOT EXISTS organizations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,
  allowed_domain  TEXT NOT NULL,
  logo_url        TEXT,
  bgm_url         TEXT,
  bgm_enabled     BOOLEAN DEFAULT FALSE,
  bgm_volume      INT DEFAULT 50,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- logo_url カラムが存在しない場合のみ追加
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- メンバー
CREATE TABLE IF NOT EXISTS members (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users NOT NULL,
  organization_id UUID REFERENCES organizations NOT NULL,
  role            TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  display_name    TEXT,
  avatar_url      TEXT,
  bio             TEXT CHECK (char_length(bio) <= 100),
  favorite_types  TEXT[],
  favorite_shop_id UUID,
  tier_public     BOOLEAN DEFAULT TRUE,
  is_setup_done   BOOLEAN DEFAULT FALSE,
  joined_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, organization_id)
);

-- ラーメン屋
CREATE TABLE IF NOT EXISTS ramen_shops (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations NOT NULL,
  google_place_id TEXT,
  name            TEXT NOT NULL,
  address         TEXT,
  lat             DECIMAL(9,6),
  lng             DECIMAL(9,6),
  ramen_type      TEXT[],
  photo_url       TEXT,
  added_by        UUID REFERENCES members NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, google_place_id)
);

-- favorite_shop_id の外部キー制約（既存の場合はスキップ）
DO $$ BEGIN
  ALTER TABLE members ADD CONSTRAINT fk_favorite_shop
    FOREIGN KEY (favorite_shop_id) REFERENCES ramen_shops(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Tier評価
CREATE TABLE IF NOT EXISTS tier_ratings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id       UUID REFERENCES members NOT NULL,
  shop_id         UUID REFERENCES ramen_shops NOT NULL,
  organization_id UUID REFERENCES organizations NOT NULL,
  tier            CHAR(1) CHECK (tier IN ('S','A','B','C','D')),
  score_noodle    NUMERIC(3,1) CHECK (score_noodle BETWEEN 0 AND 10),
  score_soup      NUMERIC(3,1) CHECK (score_soup BETWEEN 0 AND 10),
  score_toppings  NUMERIC(3,1) CHECK (score_toppings BETWEEN 0 AND 10),
  score_wait      NUMERIC(3,1) CHECK (score_wait BETWEEN 0 AND 10),
  score_speed     NUMERIC(3,1) CHECK (score_speed BETWEEN 0 AND 10),
  score_location  NUMERIC(3,1) CHECK (score_location BETWEEN 0 AND 10),
  highlights      TEXT[],
  comment         TEXT CHECK (char_length(comment) <= 200),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(member_id, shop_id)
);

-- ウィッシュリスト
CREATE TABLE IF NOT EXISTS wish_list (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id       UUID REFERENCES members NOT NULL,
  shop_id         UUID REFERENCES ramen_shops NOT NULL,
  organization_id UUID REFERENCES organizations NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(member_id, shop_id)
);

-- 投稿
CREATE TABLE IF NOT EXISTS posts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id       UUID REFERENCES members NOT NULL,
  organization_id UUID REFERENCES organizations NOT NULL,
  shop_id         UUID REFERENCES ramen_shops,
  caption         TEXT,
  ramen_type      TEXT,
  image_urls      TEXT[],
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- いいね
CREATE TABLE IF NOT EXISTS post_likes (
  post_id     UUID REFERENCES posts NOT NULL,
  member_id   UUID REFERENCES members NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (post_id, member_id)
);

-- コメント
CREATE TABLE IF NOT EXISTS post_comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID REFERENCES posts NOT NULL,
  member_id   UUID REFERENCES members NOT NULL,
  body        TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================
-- Row Level Security
-- ============================

ALTER TABLE organizations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE members        ENABLE ROW LEVEL SECURITY;
ALTER TABLE ramen_shops    ENABLE ROW LEVEL SECURITY;
ALTER TABLE tier_ratings   ENABLE ROW LEVEL SECURITY;
ALTER TABLE wish_list      ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments  ENABLE ROW LEVEL SECURITY;

-- ============================
-- Helper functions
-- ============================

CREATE OR REPLACE FUNCTION get_my_member_id(org_id UUID)
RETURNS UUID AS $$
  SELECT id FROM members WHERE user_id = auth.uid() AND organization_id = org_id LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_org_member(org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM members WHERE user_id = auth.uid() AND organization_id = org_id
  );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_org_admin(org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM members
    WHERE user_id = auth.uid() AND organization_id = org_id AND role IN ('owner', 'admin')
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================
-- RLS ポリシー（既存を削除してから再作成）
-- ============================

-- Organizations
DROP POLICY IF EXISTS "org_read" ON organizations;
CREATE POLICY "org_read" ON organizations FOR SELECT
  USING (is_org_member(id));

-- Members
DROP POLICY IF EXISTS "members_read"   ON members;
DROP POLICY IF EXISTS "members_insert" ON members;
DROP POLICY IF EXISTS "members_update" ON members;

CREATE POLICY "members_read" ON members FOR SELECT
  USING (is_org_member(organization_id));

CREATE POLICY "members_insert" ON members FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "members_update" ON members FOR UPDATE
  USING (user_id = auth.uid());

-- RamenShops
DROP POLICY IF EXISTS "shops_read"   ON ramen_shops;
DROP POLICY IF EXISTS "shops_insert" ON ramen_shops;

CREATE POLICY "shops_read" ON ramen_shops FOR SELECT
  USING (is_org_member(organization_id));

CREATE POLICY "shops_insert" ON ramen_shops FOR INSERT
  WITH CHECK (is_org_member(organization_id));

-- TierRatings
DROP POLICY IF EXISTS "tier_read"   ON tier_ratings;
DROP POLICY IF EXISTS "tier_insert" ON tier_ratings;
DROP POLICY IF EXISTS "tier_update" ON tier_ratings;
DROP POLICY IF EXISTS "tier_delete" ON tier_ratings;

CREATE POLICY "tier_read" ON tier_ratings FOR SELECT
  USING (is_org_member(organization_id));

CREATE POLICY "tier_insert" ON tier_ratings FOR INSERT
  WITH CHECK (member_id = get_my_member_id(organization_id));

CREATE POLICY "tier_update" ON tier_ratings FOR UPDATE
  USING (member_id = get_my_member_id(organization_id));

CREATE POLICY "tier_delete" ON tier_ratings FOR DELETE
  USING (member_id = get_my_member_id(organization_id));

-- WishList
DROP POLICY IF EXISTS "wish_read"   ON wish_list;
DROP POLICY IF EXISTS "wish_insert" ON wish_list;
DROP POLICY IF EXISTS "wish_delete" ON wish_list;

CREATE POLICY "wish_read" ON wish_list FOR SELECT
  USING (is_org_member(organization_id));

CREATE POLICY "wish_insert" ON wish_list FOR INSERT
  WITH CHECK (member_id = get_my_member_id(organization_id));

CREATE POLICY "wish_delete" ON wish_list FOR DELETE
  USING (member_id = get_my_member_id(organization_id));

-- Posts
DROP POLICY IF EXISTS "posts_read"   ON posts;
DROP POLICY IF EXISTS "posts_insert" ON posts;
DROP POLICY IF EXISTS "posts_delete" ON posts;

CREATE POLICY "posts_read" ON posts FOR SELECT
  USING (is_org_member(organization_id));

CREATE POLICY "posts_insert" ON posts FOR INSERT
  WITH CHECK (member_id = get_my_member_id(organization_id));

CREATE POLICY "posts_delete" ON posts FOR DELETE
  USING (member_id = get_my_member_id(organization_id));

-- PostLikes
DROP POLICY IF EXISTS "likes_read"   ON post_likes;
DROP POLICY IF EXISTS "likes_insert" ON post_likes;
DROP POLICY IF EXISTS "likes_delete" ON post_likes;

CREATE POLICY "likes_read" ON post_likes FOR SELECT
  USING (EXISTS (SELECT 1 FROM posts p WHERE p.id = post_id AND is_org_member(p.organization_id)));

CREATE POLICY "likes_insert" ON post_likes FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM posts p WHERE p.id = post_id AND is_org_member(p.organization_id)));

CREATE POLICY "likes_delete" ON post_likes FOR DELETE
  USING (member_id = (SELECT id FROM members WHERE user_id = auth.uid() LIMIT 1));

-- PostComments
DROP POLICY IF EXISTS "comments_read"   ON post_comments;
DROP POLICY IF EXISTS "comments_insert" ON post_comments;
DROP POLICY IF EXISTS "comments_delete" ON post_comments;

CREATE POLICY "comments_read" ON post_comments FOR SELECT
  USING (EXISTS (SELECT 1 FROM posts p WHERE p.id = post_id AND is_org_member(p.organization_id)));

CREATE POLICY "comments_insert" ON post_comments FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM posts p WHERE p.id = post_id AND is_org_member(p.organization_id)));

CREATE POLICY "comments_delete" ON post_comments FOR DELETE
  USING (member_id = (SELECT id FROM members WHERE user_id = auth.uid() LIMIT 1));

-- ============================
-- Storage バケット用 SQL（ダッシュボードから作成後に実行）
-- ============================
-- 以下は Storage > Policies から設定するか、SQL で実行：
--
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars',     'avatars',     true) ON CONFLICT DO NOTHING;
-- INSERT INTO storage.buckets (id, name, public) VALUES ('post-images', 'post-images', true) ON CONFLICT DO NOTHING;
-- INSERT INTO storage.buckets (id, name, public) VALUES ('org-sounds',  'org-sounds',  true) ON CONFLICT DO NOTHING;
-- INSERT INTO storage.buckets (id, name, public) VALUES ('org-images',  'org-images',  true) ON CONFLICT DO NOTHING;

-- ============================
-- インデックス
-- ============================

CREATE INDEX IF NOT EXISTS idx_members_user_id ON members(user_id);
CREATE INDEX IF NOT EXISTS idx_members_org      ON members(organization_id);
CREATE INDEX IF NOT EXISTS idx_shops_org        ON ramen_shops(organization_id);
CREATE INDEX IF NOT EXISTS idx_tier_member      ON tier_ratings(member_id);
CREATE INDEX IF NOT EXISTS idx_tier_shop        ON tier_ratings(shop_id);
CREATE INDEX IF NOT EXISTS idx_tier_org         ON tier_ratings(organization_id);
CREATE INDEX IF NOT EXISTS idx_wish_member      ON wish_list(member_id);
CREATE INDEX IF NOT EXISTS idx_posts_org        ON posts(organization_id);
CREATE INDEX IF NOT EXISTS idx_posts_member     ON posts(member_id);
CREATE INDEX IF NOT EXISTS idx_posts_shop       ON posts(shop_id);
