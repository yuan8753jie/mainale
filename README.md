# 埋哪了

为无碑墓地创建数字标记，让后人能找到先人安息之处。

## 功能

- GPS定位打点
- 拍照记录
- 填写基本信息（姓名、称谓、备注）
- 列表查看所有记录
- 导航到墓地位置（高德地图）
- 分享链接给家人

## 技术栈

- **前端**: Next.js 14 (App Router) + Tailwind CSS
- **后端**: Supabase (PostgreSQL + Storage + Auth)
- **认证**: 手机号短信登录

## 快速开始

### 1. 创建 Supabase 项目

1. 访问 [supabase.com](https://supabase.com) 创建免费账号
2. 创建新项目
3. 在 SQL Editor 中运行 `supabase-schema.sql` 创建数据库表

### 2. 配置 Storage Bucket

在 Supabase Dashboard:
1. 进入 Storage
2. 创建名为 `photos` 的 bucket，设置为 Public
3. 添加策略允许认证用户上传

### 3. 配置短信认证（可选）

Supabase 默认使用 Twilio 发送短信：
1. 进入 Authentication > Providers
2. 配置 Phone (SMS) 认证
3. 填入 Twilio 账号信息

> 开发阶段可以在 Authentication > Users 手动创建用户测试

### 4. 配置环境变量

复制 `.env.local.example` 为 `.env.local`，填入 Supabase 配置：

```bash
cp .env.local.example .env.local
```

从 Supabase Dashboard > Settings > API 获取：
- `NEXT_PUBLIC_SUPABASE_URL`: Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: anon/public key

### 5. 本地运行

```bash
npm install
npm run dev
```

访问 http://localhost:3000

### 6. 部署到 Vercel

1. 推送代码到 GitHub
2. 在 Vercel 导入项目
3. 添加环境变量
4. 部署完成

## 项目结构

```
mainale/
├── app/
│   ├── page.tsx              # 首页（列表）
│   ├── login/page.tsx        # 登录页
│   ├── add/page.tsx          # 新增记录
│   ├── [id]/page.tsx         # 详情页
│   ├── [id]/edit/page.tsx    # 编辑页
│   └── share/[code]/page.tsx # 分享页（无需登录）
├── components/
│   ├── Header.tsx
│   ├── GraveCard.tsx
│   ├── LocationPicker.tsx
│   └── PhotoUpload.tsx
├── lib/
│   ├── supabase.ts           # Supabase 客户端
│   ├── types.ts              # TypeScript 类型
│   └── utils.ts              # 工具函数
└── supabase-schema.sql       # 数据库 Schema
```

## 数据库表结构

```sql
graves (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,        -- 用户ID
  name TEXT NOT NULL,           -- 先人姓名
  relation TEXT NOT NULL,       -- 称谓（爷爷、奶奶等）
  note TEXT,                    -- 备注
  latitude DOUBLE PRECISION,    -- 纬度
  longitude DOUBLE PRECISION,   -- 经度
  accuracy DOUBLE PRECISION,    -- GPS精度
  photo_url TEXT,               -- 照片URL
  share_code TEXT UNIQUE,       -- 分享码
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

## License

MIT
