-- 创建 graves 表
CREATE TABLE graves (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  relation TEXT NOT NULL,
  note TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  accuracy DOUBLE PRECISION,
  photo_url TEXT,
  share_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 创建索引
CREATE INDEX graves_user_id_idx ON graves(user_id);
CREATE INDEX graves_share_code_idx ON graves(share_code);

-- 启用 RLS (Row Level Security)
ALTER TABLE graves ENABLE ROW LEVEL SECURITY;

-- 策略：用户只能查看自己的记录
CREATE POLICY "Users can view own graves" ON graves
  FOR SELECT USING (auth.uid() = user_id);

-- 策略：用户只能插入自己的记录
CREATE POLICY "Users can insert own graves" ON graves
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 策略：用户只能更新自己的记录
CREATE POLICY "Users can update own graves" ON graves
  FOR UPDATE USING (auth.uid() = user_id);

-- 策略：用户只能删除自己的记录
CREATE POLICY "Users can delete own graves" ON graves
  FOR DELETE USING (auth.uid() = user_id);

-- 策略：任何人可以通过 share_code 查看（用于分享功能）
CREATE POLICY "Anyone can view by share_code" ON graves
  FOR SELECT USING (true);

-- 创建 updated_at 自动更新触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_graves_updated_at
  BEFORE UPDATE ON graves
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Storage bucket 配置（在 Supabase Dashboard 中执行）
-- INSERT INTO storage.buckets (id, name, public) VALUES ('photos', 'photos', true);

-- Storage 策略
-- CREATE POLICY "Users can upload photos" ON storage.objects
--   FOR INSERT WITH CHECK (bucket_id = 'photos' AND auth.role() = 'authenticated');

-- CREATE POLICY "Anyone can view photos" ON storage.objects
--   FOR SELECT USING (bucket_id = 'photos');
