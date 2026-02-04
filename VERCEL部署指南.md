# Vercel部署指南 - 宝宝起名2.0

> **项目仓库**: https://github.com/2536654949-commits/baby-naming-app
> **部署平台**: Vercel
> **最后更新**: 2026-02-03

---

## 📦 项目架构

```
宝宝起名2.0/
├── backend/                    # 后端Express服务
│   ├── src/
│   ├── prisma/
│   └── vercel.json            # 后端部署配置
└── 前端代码/
    └── ai-baby-naming-(ai宝宝起名) (1)/  # 前端React应用
        ├── src/
        └── vercel.json        # 前端部署配置
```

---

## 🚀 部署步骤

### 第一步：部署后端（Backend）

#### 1.1 登录Vercel并导入项目

1. 访问 [Vercel Dashboard](https://vercel.com/new)
2. 点击 **Import Git Repository**
3. 选择您的GitHub账号并授权访问
4. 选择仓库：`2536654949-commits/baby-naming-app`

#### 1.2 配置后端项目

| 配置项 | 值 |
|--------|-----|
| **Project Name** | `baby-name-backend`（或自定义名称） |
| **Framework Preset** | Other |
| **Root Directory** | `backend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

#### 1.3 配置环境变量

在 **Environment Variables** 部分添加以下变量：

```bash
# ========== 数据库配置 ==========
# Supabase PostgreSQL连接字符串
# Transaction Pooler模式 - 用于应用连接（端口6543，带pgbouncer参数）
DATABASE_URL=postgresql://postgres.[项目ID]:[密码]@aws-0-[区域].pooler.supabase.com:6543/postgres?pgbouncer=true&connect_timeout=30

# Session Pooler模式 - 用于数据库迁移（端口5432，直连模式）
DIRECT_URL=postgresql://postgres.[项目ID]:[密码]@aws-0-[区域].pooler.supabase.com:5432/postgres?connect_timeout=30

# 无数据库启动开关（可选，默认false）
ALLOW_NO_DB=false

# ========== JWT认证 ==========
# JWT密钥（必须是强随机字符串，至少32字符）
# 🔐 生成强密钥的方法（在本地终端执行）：
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long

# JWT过期时间（默认90天）
JWT_EXPIRES_IN=90d

# ========== Redis缓存（可选但推荐用于速率限制） ==========
# 如果使用Upstash Redis
REDIS_URL=redis://default:[密码]@[主机]:[端口]

# 如果不配置Redis，系统会自动降级为内存缓存（多实例环境下速率限制会失效）

# ========== AI服务配置 ==========
# AI API密钥（支持DeepSeek、OpenAI、智谱AI等兼容OpenAI格式的服务）
# DeepSeek: 在 https://platform.deepseek.com/ 获取
# OpenAI: 在 https://platform.openai.com/ 获取
# 智谱AI: 在 https://open.bigmodel.cn/ 获取
AI_API_KEY=your-ai-api-key-here

# AI API地址（根据使用的服务选择）
# DeepSeek: https://api.deepseek.com/v1/chat/completions
# OpenAI: https://api.openai.com/v1/chat/completions
# 智谱AI: https://open.bigmodel.cn/api/paas/v4/chat/completions
AI_API_URL=https://api.deepseek.com/v1/chat/completions

# AI 模型名称（根据使用的服务选择）
# DeepSeek: deepseek-chat, deepseek-reasoner
# OpenAI: gpt-4, gpt-3.5-turbo, gpt-4-turbo
# 智谱AI: glm-4, glm-4-plus
AI_MODEL=deepseek-chat

# 可选高级配置（一般使用默认值即可）
# AI_API_TIMEOUT=60000        # API超时时间（毫秒）
# AI_MAX_TOKENS=1200          # 最大生成token数
# AI_TEMPERATURE=0.8          # 温度参数（0-1，越高越随机）
# AI_TOP_P=0.9                # 核采样参数

# ========== 速率限制配置 ==========
# 限流时间窗口（毫秒，默认15分钟 = 900000ms）
RATE_LIMIT_WINDOW_MS=900000

# 时间窗口内最大请求次数（默认100次）
RATE_LIMIT_MAX=100

# ========== 应用配置 ==========
NODE_ENV=production
LOG_LEVEL=info
PORT=3000

# ========== CORS配置 ==========
# 前端应用地址（单个域名）
FRONTEND_URL=https://your-frontend.vercel.app
```

#### 1.4 重要提示：数据库配置说明

**DATABASE_URL vs DIRECT_URL 的区别**：

| 环境变量 | 用途 | 端口 | 连接模式 | 使用场景 |
|---------|------|------|---------|---------|
| `DATABASE_URL` | 应用运行时连接 | 6543 | Transaction Pooler | Prisma Client查询、API请求 |
| `DIRECT_URL` | 数据库迁移 | 5432 | Session Pooler | Prisma Migrate、Schema变更 |

> 📌 **为什么需要两个URL？**
> - Vercel Serverless函数会创建大量短连接
> - Transaction Pooler (6543端口) 使用连接池，避免耗尽数据库连接
> - Schema迁移需要独占连接，使用Session Pooler (5432端口)

**生成强JWT密钥**：
```bash
# 在本地终端执行（需要Node.js环境）
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 输出示例（64个字符）：
# a3f5b8c2d1e4f7a9b2c5d8e1f4a7b0c3d6e9f2a5b8c1d4e7f0a3b6c9d2e5f8a1
```

**JWT工作原理**：
- 用户激活授权码后，后端生成JWT Token（包含userId、deviceId、code）
- Token有效期90天，存储在前端localStorage
- 每次API请求需要在Authorization头中携带Token
- 后端验证Token签名和有效期，确保请求合法

#### 1.5 构建命令优化（可选）

如果需要自动运行数据库迁移，修改构建命令为：

```bash
npm run build && npx prisma generate && npx prisma migrate deploy
```

> ⚠️ **注意**：
> - 首次部署建议先手动运行迁移（见第三步），避免构建超时
> - `prisma generate` 会根据schema.prisma生成Prisma Client
> - `prisma migrate deploy` 会应用pending的数据库迁移

#### 1.6 部署并记录后端URL

1. 点击 **Deploy** 按钮
2. 等待构建完成（约2-5分钟）
3. 部署成功后，记录后端URL（例如：`https://baby-name-backend.vercel.app`）
4. 测试健康检查接口：`https://baby-name-backend.vercel.app/health`

预期响应：
```json
{
  "status": "ok",
  "timestamp": "2026-02-03T12:00:00.000Z",
  "uptime": 123.456,
  "database": "connected"
}
```

---

### 第二步：部署前端（Frontend）

#### 2.1 创建新的Vercel项目

1. 回到 [Vercel Dashboard](https://vercel.com/new)
2. 再次选择同一个GitHub仓库：`baby-naming-app`

#### 2.2 配置前端项目

| 配置项 | 值 |
|--------|-----|
| **Project Name** | `baby-name-frontend`（或自定义名称） |
| **Framework Preset** | Vite |
| **Root Directory** | `前端代码/ai-baby-naming-(ai宝宝起名) (1)` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

#### 2.3 配置环境变量

```bash
# 后端API地址（使用第一步部署的后端URL）
VITE_API_BASE_URL=https://baby-name-backend.vercel.app
```

#### 2.4 更新前端vercel.json

在部署前，需要更新前端的 `vercel.json` 文件中的后端地址：

**文件位置**: `前端代码/ai-baby-naming-(ai宝宝起名) (1)/vercel.json`

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://baby-name-backend.vercel.app/api/:path*"
    }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

> 🔧 **重要**：将 `destination` 中的URL替换为您实际的后端URL

#### 2.5 提交更改并重新部署

```bash
# 在本地修改vercel.json后
git add "前端代码/ai-baby-naming-(ai宝宝起名) (1)/vercel.json"
git commit -m "chore: 更新前端vercel.json中的后端API地址"
git push origin master
```

#### 2.6 部署前端

1. 点击 **Deploy** 按钮
2. 等待构建完成（约2-3分钟）
3. 部署成功后访问前端URL

---

### 第三步：数据库迁移

#### 3.0 数据库Schema说明

项目使用Prisma ORM管理数据库，包含以下核心表：

| 表名 | 说明 | 关键字段 |
|------|------|---------|
| `authorization_code` | 授权码表（一客一码机制） | code（授权码）、status（状态）、deviceId（设备指纹） |
| `usage_record` | 使用记录表 | userId、babyInfo（宝宝信息）、aiResult（AI结果） |
| `favorites` | 收藏表（云端同步） | userId、nameData（名字数据） |
| `admin_user` | 管理员表 | username、passwordHash、role |
| `analytics_event` | 埋点事件表 | eventName、deviceId、properties |

**数据库连接配置**（在 [backend/prisma/schema.prisma](backend/prisma/schema.prisma:10-13)）：
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")      // 应用连接（Transaction Pooler）
  directUrl = env("DIRECT_URL")       // 迁移连接（Session Pooler）
}
```

#### 3.1 运行Prisma迁移

**选项A：本地执行**（推荐首次部署使用）

```bash
# 1. 进入backend目录
cd backend

# 2. 配置生产环境数据库URL
export DATABASE_URL="postgresql://postgres.[项目ID]:[密码]@aws-0-[区域].pooler.supabase.com:6543/postgres"

# 3. 生成Prisma Client
npx prisma generate

# 4. 运行迁移
npx prisma migrate deploy

# 5. 验证数据库表
npx prisma studio  # 打开Prisma可视化工具
```

**选项B：Vercel构建时自动执行**

在后端项目的Vercel设置中，修改构建命令：

```bash
npm run build && npx prisma generate && npx prisma migrate deploy
```

> ⚠️ **注意**：自动迁移可能导致构建时间延长，首次部署建议使用选项A

#### 3.2 初始化测试数据（可选）

如果需要测试激活码功能：

```bash
# 运行测试数据生成脚本
node backend/generate_test_codes.js
```

---

### 第四步：配置CORS和安全策略

#### 4.1 更新后端CORS配置

**方法1：通过环境变量配置（推荐）**

在Vercel后端项目的环境变量中添加：

```bash
FRONTEND_URL=https://your-frontend.vercel.app
```

后端代码会自动读取该变量（见 [backend/src/app.ts:19-23](backend/src/app.ts:19-23)）：

```typescript
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(cors({
  origin: frontendUrl,
  credentials: true,
}));
```

**方法2：修改代码支持多域名（如需自定义域名）**

编辑 [backend/src/app.ts](backend/src/app.ts)，将CORS改为数组：

```typescript
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(cors({
  origin: [
    'http://localhost:5173',              // 本地开发
    frontendUrl,                           // Vercel部署域名
    'https://custom-domain.com'            // 自定义域名（如果有）
  ],
  credentials: true,
}));
```

提交更改：

```bash
git add backend/src/app.ts
git commit -m "chore: 配置生产环境CORS支持多域名"
git push origin master
```

> 💡 **提示**：推荐使用方法1，通过环境变量配置，无需修改代码

#### 4.2 配置Redis（可选但推荐）

**推荐服务**: [Upstash Redis](https://upstash.com/)

1. 注册Upstash账号
2. 创建Redis数据库（选择与Vercel相同的区域）
3. 获取连接信息：
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
4. 在Vercel后端项目中添加环境变量

如果不配置Redis：
- 系统会使用内存存储（重启后数据丢失）
- 速率限制在多实例环境下可能不准确

---

## ✅ 部署验证清单

### 后端验证

- [ ] 访问 `/health` 端点返回状态正常
- [ ] 数据库连接成功（health响应中显示 `"database": "connected"`）
- [ ] 日志正常输出到Vercel日志面板
- [ ] API接口响应正常（测试 `/api/auth/activate`）

### 前端验证

- [ ] 页面正常加载，无控制台错误
- [ ] 激活码输入页面功能正常
- [ ] API请求能够正确代理到后端
- [ ] 生成名字功能正常工作
- [ ] 收藏功能正常工作

### 安全性验证

- [ ] 环境变量未泄露（检查构建日志）
- [ ] CORS配置正确（只允许指定域名）
- [ ] 速率限制生效（15分钟内最多60次请求）
- [ ] JWT认证正常（未授权请求返回401）

---

## 🔧 常见问题排查

### 问题1：数据库连接失败

**错误信息**: `database: "disconnected"` 或 `P1001: Can't reach database server`

**解决方案**:
1. 检查Supabase数据库是否正常运行
2. 确认 `DATABASE_URL` 使用的是 **Transaction模式** 的连接字符串
3. 检查Supabase防火墙设置（应允许所有IP：`0.0.0.0/0`）
4. 验证数据库密码是否正确

### 问题2：前端API请求失败（CORS错误）

**错误信息**: `Access to fetch at 'xxx' from origin 'xxx' has been blocked by CORS policy`

**解决方案**:
1. 检查后端 `app.ts` 中的CORS配置
2. 确认前端域名已添加到 `origin` 白名单
3. 重新部署后端项目

### 问题3：AI服务调用失败

**错误信息**: `401 Unauthorized` 或 `Invalid API key` 或 `AI_SERVICE_UNAVAILABLE`

**解决方案**:
1. 检查Vercel环境变量中的 `AI_API_KEY` 是否正确
2. 验证 `AI_API_URL` 和 `AI_MODEL` 是否匹配（例如DeepSeek的URL必须配合deepseek-chat模型）
3. 登录对应AI服务控制台验证API密钥有效性：
   - DeepSeek: https://platform.deepseek.com/
   - OpenAI: https://platform.openai.com/
   - 智谱AI: https://open.bigmodel.cn/
4. 检查AI服务账户余额是否充足

### 问题4：JWT验证失败

**错误信息**: `401 Unauthorized` 或 `Invalid token`

**解决方案**:
1. 确认后端环境变量中配置了 `JWT_SECRET`（生产环境必须配置，否则应用会启动失败）
2. 如果更换了JWT密钥，需要清除前端localStorage（所有用户需要重新激活）
3. 检查JWT过期时间（默认90天，通过 `JWT_EXPIRES_IN` 配置）
4. 验证Token格式：Bearer <token>

**JWT认证流程**：
```mermaid
sequenceDiagram
    participant 用户
    participant 前端
    participant 后端
    participant 数据库

    用户->>前端: 输入授权码
    前端->>后端: POST /api/auth/activate
    后端->>数据库: 验证授权码状态
    数据库-->>后端: 授权码有效
    后端->>后端: 生成JWT Token
    Note right of 后端: Payload: {userId, deviceId, code}<br/>签名: JWT_SECRET<br/>过期: 90天
    后端-->>前端: 返回Token
    前端->>前端: 存储到localStorage
    前端->>后端: 后续请求携带Token
    Note right of 前端: Header: Authorization: Bearer <token>
    后端->>后端: 验证Token签名和有效期
    后端-->>前端: 返回数据
```

Token生成位置：[backend/src/services/jwt.service.ts:21-40](backend/src/services/jwt.service.ts:21-40)

### 问题5：构建超时

**错误信息**: `Build exceeded maximum time limit`

**解决方案**:
1. 移除构建命令中的 `prisma migrate deploy`
2. 改为手动运行数据库迁移
3. 检查 `node_modules` 是否被正确排除（.gitignore）

---

## 🎯 性能优化建议

### 1. 启用Edge Network

在Vercel项目设置中启用Edge Network，降低全球访问延迟。

### 2. 配置缓存策略

前端静态资源已配置永久缓存：

```json
{
  "source": "/assets/(.*)",
  "headers": [
    {
      "key": "Cache-Control",
      "value": "public, max-age=31536000, immutable"
    }
  ]
}
```

### 3. 数据库连接池优化

使用Supabase的Pooler模式（端口6543）而非Direct模式（端口5432）：

```
# ✅ 推荐：Transaction Pooler
postgresql://...@aws-0-region.pooler.supabase.com:6543/postgres

# ❌ 避免：Direct Connection（Serverless环境会耗尽连接）
postgresql://...@aws-0-region.pooler.supabase.com:5432/postgres
```

### 4. Redis连接优化

选择与Vercel部署区域相同的Upstash区域，降低延迟。

---

## 📊 监控和日志

### Vercel日志

访问 Vercel Dashboard → 选择项目 → **Logs** 查看：
- 实时请求日志
- 错误堆栈信息
- 构建日志

### Prisma日志

后端已配置Winston日志，输出内容包括：
- 数据库查询（开发环境）
- API请求响应时间
- 错误详情

### 速率限制监控

Redis中存储的速率限制数据：
- Key格式: `rate-limit:{IP地址}`
- 过期时间: 15分钟

---

## 🔐 环境变量完整清单

### 后端（Backend）

| 变量名 | 必需 | 说明 | 示例 | 默认值 |
|--------|------|------|------|--------|
| `DATABASE_URL` | ✅ | PostgreSQL连接字符串（Transaction Pooler，端口6543） | `postgresql://postgres.xxx:pass@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true&connect_timeout=30` | - |
| `DIRECT_URL` | ✅ | PostgreSQL直连字符串（Session Pooler，端口5432，用于迁移） | `postgresql://postgres.xxx:pass@aws-0-region.pooler.supabase.com:5432/postgres?connect_timeout=30` | - |
| `JWT_SECRET` | ✅ | JWT签名密钥（至少32字符，生产环境必须） | `a3f5b8c2d1e4f7a9b2c5...`（64字符） | `baby-name-secret-key-2025-dev-only` |
| `JWT_EXPIRES_IN` | ⭕ | JWT过期时间 | `90d` | `90d` |
| `AI_API_KEY` | ✅ | AI服务API密钥（支持DeepSeek、OpenAI、智谱AI等） | `your-api-key` | - |
| `AI_API_URL` | ⭕ | AI API地址 | `https://api.deepseek.com/v1/chat/completions` | DeepSeek地址 |
| `AI_MODEL` | ⭕ | AI模型名称 | `deepseek-chat` | `deepseek-chat` |
| `AI_API_TIMEOUT` | ⭕ | API超时时间（毫秒） | `60000` | `60000` |
| `AI_MAX_TOKENS` | ⭕ | 最大生成token数 | `1200` | `1200` |
| `AI_TEMPERATURE` | ⭕ | 温度参数（0-1） | `0.8` | `0.8` |
| `AI_TOP_P` | ⭕ | 核采样参数 | `0.9` | 根据模型自动 |
| `NODE_ENV` | ✅ | 运行环境 | `production` | `development` |
| `LOG_LEVEL` | ⭕ | 日志级别（debug/info/warn/error） | `info` | `debug` |
| `PORT` | ⭕ | 服务端口 | `3000` | `3000` |
| `REDIS_URL` | ⭕ | Redis连接URL（用于速率限制） | `redis://default:pass@host:port` | - |
| `FRONTEND_URL` | ⭕ | 前端域名（用于CORS） | `https://your-frontend.vercel.app` | `http://localhost:5173` |
| `RATE_LIMIT_WINDOW_MS` | ⭕ | 速率限制时间窗口（毫秒） | `900000` | `900000` |
| `RATE_LIMIT_MAX` | ⭕ | 时间窗口内最大请求数 | `100` | `100` |
| `ALLOW_NO_DB` | ⭕ | 允许无数据库启动（调试用） | `false` | `false` |

### 前端（Frontend）

| 变量名 | 必需 | 说明 | 示例 |
|--------|------|------|------|
| `VITE_API_BASE_URL` | ✅ | 后端API地址 | `https://baby-name-backend.vercel.app` |

---

## 📝 部署后检查清单

完成所有部署步骤后，请逐项确认：

### 基础部署
- [ ] 后端项目在Vercel成功部署
- [ ] 前端项目在Vercel成功部署
- [ ] 所有必需环境变量已配置
- [ ] 数据库迁移已成功执行

### 功能测试
- [ ] 激活码验证功能正常
- [ ] AI起名功能正常（传统风格 + 现代风格）
- [ ] 收藏功能正常
- [ ] 历史记录功能正常
- [ ] 速率限制生效（60次/15分钟）

### 安全性
- [ ] 前端vercel.json中的后端URL已更新
- [ ] 后端CORS白名单包含前端域名
- [ ] 所有.env文件未提交到Git
- [ ] JWT密钥强度足够（>=32字符）
- [ ] Supabase数据库启用SSL连接

### 性能优化
- [ ] 前端静态资源缓存配置生效
- [ ] 使用Supabase Transaction Pooler
- [ ] Redis已配置（如适用）
- [ ] 选择了合适的Vercel部署区域

---

## 🔒 安全最佳实践

### 1. JWT密钥管理

**❌ 不安全的做法**：
```bash
# 太短，容易被暴力破解
JWT_SECRET="12345678"

# 使用默认值
JWT_SECRET="baby-name-secret-key-2025-dev-only"
```

**✅ 安全的做法**：
```bash
# 生成强随机密钥（64字符）
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 示例输出
JWT_SECRET="a3f5b8c2d1e4f7a9b2c5d8e1f4a7b0c3d6e9f2a5b8c1d4e7f0a3b6c9d2e5f8a1"
```

### 2. 数据库连接安全

- ✅ 始终使用SSL连接（Supabase默认启用）
- ✅ 使用Transaction Pooler（6543端口）避免连接耗尽
- ✅ 设置 `connect_timeout=30` 参数避免长时间等待
- ❌ 不要在日志中输出 `DATABASE_URL`

### 3. 环境变量保护

- ✅ 所有敏感信息通过Vercel环境变量配置
- ✅ 确保 `.env` 文件在 `.gitignore` 中
- ✅ 使用 `.env.example` 作为模板，不包含真实密钥
- ❌ 永远不要提交真实的 `.env` 文件到Git

### 4. CORS策略

当前配置（见 [backend/src/app.ts:20-23](backend/src/app.ts:20-23)）：
```typescript
// 只允许指定的前端域名访问
app.use(cors({
  origin: frontendUrl,        // 单一域名，安全
  credentials: true,
}));
```

**不要这样做**：
```typescript
// ❌ 允许所有域名访问（不安全）
app.use(cors({
  origin: '*',
  credentials: true,
}));
```

### 5. 速率限制

配置合理的速率限制（防止API滥用）：
```bash
# 15分钟内最多100次请求
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

建议生产环境配置Redis，否则多实例环境下速率限制会失效。

### 6. 日志安全

- ✅ 生产环境设置 `LOG_LEVEL=info`（避免输出敏感查询）
- ✅ 不要记录用户密码、Token等敏感信息
- ✅ 定期清理旧日志（Vercel自动保留7天）

### 7. 数据库Schema安全

- ✅ 授权码使用SHA256加密设备指纹（见 [backend/prisma/schema.prisma:20](backend/prisma/schema.prisma:20)）
- ✅ 管理员密码使用bcrypt哈希存储（见 [backend/prisma/schema.prisma:77](backend/prisma/schema.prisma:77)）
- ✅ 敏感操作记录IP地址用于审计

## 🆘 技术支持

如遇到部署问题，请按以下顺序排查：

1. **检查Vercel构建日志** → 查看详细错误信息
2. **检查Runtime日志** → 查看运行时错误
3. **测试本地环境** → 确认代码本身无问题
4. **验证环境变量** → 确保所有必需变量已配置
5. **检查数据库连接** → 访问 `/health` 端点
6. **验证JWT配置** → 确认 `JWT_SECRET` 已设置且长度>=32字符

---

## 📅 版本记录

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| v1.0 | 2026-02-03 | 初始版本，包含完整部署流程 |

---

**部署成功后，您的应用将具备以下能力：**

✅ 全球CDN加速访问
✅ 自动HTTPS证书
✅ 无服务器自动扩展
✅ 实时日志监控
✅ Git推送自动部署

祝您部署顺利！🎉
