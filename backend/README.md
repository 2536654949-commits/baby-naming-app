# 宝宝起名应用 - 后端服务

> **版本:** 2.0.0
> **功能:** 授权认证系统 + AI起名核心功能

## 项目结构

```
backend/
├── prisma/
│   └── schema.prisma          # 数据模型定义
├── src/
│   ├── app.ts                 # Express应用配置
│   ├── server.ts              # 服务器入口
│   ├── config/                # 配置模块
│   │   ├── database.ts        # Prisma客户端
│   │   └── jwt.ts             # JWT配置
│   ├── controllers/           # 控制器层
│   │   ├── auth.controller.ts # 认证控制器
│   │   ├── name.controller.ts # 起名控制器
│   │   └── health.controller.ts
│   ├── services/              # 业务逻辑层
│   │   ├── jwt.service.ts     # JWT服务
│   │   ├── code.service.ts    # 授权码服务
│   │   ├── auth.service.ts    # 认证服务
│   │   ├── name.service.ts    # 起名服务
│   │   ├── zhipu.service.ts   # 智谱AI服务
│   │   └── rate-limit.service.ts # 频率限制服务
│   ├── repositories/          # 数据访问层
│   │   ├── code.repository.ts # 授权码仓储
│   │   └── usage.repository.ts # 使用记录仓储
│   ├── middleware/            # 中间件
│   │   ├── auth.middleware.ts # JWT认证
│   │   ├── validate.middleware.ts # 数据验证
│   │   ├── rate-limit.middleware.ts # 限流
│   │   ├── error.middleware.ts # 错误处理
│   │   └── logger.middleware.ts # 日志
│   ├── routes/                # 路由定义
│   │   ├── auth.routes.ts     # 认证路由
│   │   ├── name.routes.ts     # 起名路由
│   │   ├── health.routes.ts   # 健康检查路由
│   │   └── index.ts
│   ├── types/                 # 类型定义
│   │   ├── auth.types.ts
│   │   ├── name.types.ts
│   │   ├── zhipu.types.ts
│   │   ├── api.types.ts
│   │   ├── express.d.ts
│   │   └── index.ts
│   └── utils/                 # 工具函数
│       ├── error.ts           # 自定义错误类
│       ├── mask.ts            # 数据脱敏
│       ├── device-fingerprint.ts # 设备指纹
│       ├── logger.ts          # 日志配置
│       └── index.ts
├── logs/                      # 日志目录
├── .env                       # 环境变量
├── .env.example               # 环境变量示例
├── package.json
├── tsconfig.json
└── nodemon.json
```

## 快速开始

### 1. 安装依赖

```bash
cd backend
npm install
```

### 2. 配置环境变量

复制 `.env.example` 到 `.env` 并填写配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
# 数据库配置 (Supabase)
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# JWT配置
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="90d"

# 智谱AI配置
ZHIPU_API_KEY=your-zhipu-api-key
ZHIPU_API_URL="https://open.bigmodel.cn/api/paas/v4/chat/completions"

# 前端地址
FRONTEND_URL="http://localhost:5178"

# Redis配置（可选，用于频率限制）
REDIS_URL="redis://localhost:6379"

# 服务器配置
PORT=3000
NODE_ENV="development"
```

### 3. 初始化数据库

```bash
# 生成Prisma客户端
npm run prisma:generate

# 运行数据库迁移
npm run prisma:migrate
```

### 4. 启动开发服务器

```bash
npm run dev
```

服务将在 `http://localhost:3000` 启动。

## API 接口

### 认证接口

#### 1. 验证授权码（激活）

**POST** `/api/auth/validate`

请求体：
```json
{
  "code": "BABY-A3F7-92D1-4E8C",
  "deviceId": "sha256-hash-of-useragent-and-ip"
}
```

成功响应：
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "recovered": false,
    "message": "激活成功"
  }
}
```

错误码：
- `CODE_FORMAT_INVALID` - 授权码格式不正确
- `CODE_NOT_FOUND` - 授权码不存在
- `CODE_ALREADY_USED` - 授权码已被使用
- `CODE_EXPIRED` - 授权码已过期

#### 2. 恢复Token

**POST** `/api/auth/recover`

请求体：
```json
{
  "code": "BABY-A3F7-92D1-4E8C",
  "deviceId": "sha256-hash-of-useragent-and-ip"
}
```

成功响应：
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "recovered": true,
    "message": "Token恢复成功"
  }
}
```

错误码：
- `DEVICE_MISMATCH` - 设备指纹不匹配

#### 3. 获取授权状态

**GET** `/api/auth/status`

请求头：
```
Authorization: Bearer <token>
```

响应：
```json
{
  "success": true,
  "data": {
    "activated": true,
    "code": "BABY-A3F7-****-****",
    "deviceId": "device-fingerprint",
    "activatedAt": "2025-01-20T10:30:00.000Z"
  }
}
```

### 起名接口

#### 1. AI生成名字

**POST** `/api/name/generate`

请求头：
```
Authorization: Bearer <token>
```

请求体：
```json
{
  "surname": "李",
  "gender": "male",
  "birthDate": "2025-03-15",
  "birthTime": "08:30",
  "requirements": "希望名字有书卷气"
}
```

成功响应：
```json
{
  "success": true,
  "data": {
    "names": [
      {
        "id": "name-uuid-1",
        "name": "明轩",
        "full_name": "李明轩",
        "pinyin": "Lǐ Míngxuān",
        "meaning": "明亮高远，寓意前程似锦",
        "cultural_source": "《诗经·大雅》",
        "wuxing_analysis": "五行：火木",
        "score": 95,
        "highlight": "书卷气浓厚，音律优美"
      }
    ],
    "generationTime": 1234
  }
}
```

错误码：
- `RATE_LIMIT_EXCEEDED` - 操作过于频繁
- `INVALID_TOKEN` - Token无效或已过期

#### 2. 获取历史记录

**GET** `/api/name/history`

请求头：
```
Authorization: Bearer <token>
```

查询参数：
- `limit`: 返回数量（默认100）
- `offset`: 偏移量（默认0）

响应：
```json
{
  "success": true,
  "data": {
    "records": [
      {
        "id": "record-uuid-1",
        "date": "2023-10-27",
        "surname": "陈",
        "gender": "男孩",
        "names": ["名字1", "名字2", "名字3", "名字4", "名字5"],
        "createdAt": "2023-10-27T10:30:00.000Z"
      }
    ],
    "total": 15,
    "hasMore": false
  }
}
```

#### 3. 获取频率限制状态

**GET** `/api/name/rate-limit`

请求头：
```
Authorization: Bearer <token>
```

响应：
```json
{
  "success": true,
  "data": {
    "waitSeconds": 0,
    "canGenerate": true
  }
}
```

### 健康检查

**GET** `/health`

响应：
```json
{
  "status": "healthy",
  "timestamp": "2025-01-20T10:30:00.000Z",
  "database": "connected",
  "uptime": "10m 30s"
}
```

## 核心功能

### 1. 一客一码授权机制

- **授权码格式:** `BABY-XXXX-XXXX-XXXX-XXXX`（16位）
- **激活后:** 授权码状态变为USED，永久有效
- **设备绑定:** 首次激活时绑定设备指纹
- **Token有效期:** 90天

### 2. Token恢复机制

- 用户清除浏览器数据后，可使用原授权码重新激活
- 系统验证设备指纹，匹配则恢复Token
- 设备不匹配时提示联系客服

### 3. 频率限制

- **授权验证:** 15分钟内最多10次
- **起名请求:** 基于用户ID，30秒内最多1次
- **全局API:** 15分钟内最多100次

### 4. 安全特性

- JWT认证
- CORS控制
- Helmet安全头部
- 请求日志
- 错误处理
- 数据脱敏

## 数据库模型

### AuthorizationCode（授权码表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Int | 主键 |
| code | String | 授权码（16位） |
| status | String | UNUSED/USED/EXPIRED |
| deviceId | String? | 设备指纹 |
| activatedAt | DateTime? | 激活时间 |
| activatedIp | String? | 激活IP |
| expiresAt | DateTime? | 过期时间 |
| batchId | String? | 批次ID |
| metadata | String? | 元数据JSON |

### UsageRecord（使用记录表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Int | 主键 |
| codeId | Int | 关联授权码 |
| code | String | 授权码 |
| userId | String | 用户ID |
| deviceId | String | 设备ID |
| babyInfo | Json | 宝宝信息 |
| aiResult | Json | AI生成结果 |
| generationTime | Int? | 生成耗时(ms) |
| createdAt | DateTime | 创建时间 |

## 开发命令

```bash
# 开发模式（热重载）
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start

# Prisma相关
npm run prisma:generate  # 生成客户端
npm run prisma:migrate   # 运行迁移
npm run prisma:studio    # 打开数据库GUI
npm run prisma:reset     # 重置数据库
```

## 日志

日志文件位于 `logs/` 目录：

- `error.log` - 错误日志
- `combined.log` - 全部日志

日志轮转：5MB自动轮转，保留5个历史文件。

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| DATABASE_URL | 数据库连接字符串 | - |
| ALLOW_NO_DB | 无数据库启动开关 | false |
| JWT_SECRET | JWT密钥 | - |
| JWT_EXPIRES_IN | Token过期时间 | 90d |
| FRONTEND_URL | 前端地址 | http://localhost:5178 |
| PORT | 服务端口 | 3000 |
| NODE_ENV | 运行环境 | development |
| ZHIPU_API_KEY | 智谱AI API密钥 | - |
| ZHIPU_API_URL | 智谱AI API地址 | https://open.bigmodel.cn/api/paas/v4/chat/completions |
| REDIS_URL | Redis连接字符串（可选） | - |

## 生产部署

1. 设置 `NODE_ENV=production`
2. 使用强密钥替换 `JWT_SECRET`
3. 配置正确的数据库连接字符串
4. 运行 `npm run build` 构建
5. 执行 `npm run prisma:deploy` 部署数据库迁移
6. 执行 `npm start` 启动服务

## 常见问题

### 数据库连接失败

检查 `.env` 中的 `DATABASE_URL` 是否正确。
如需在无数据库情况下启动服务，可设置 `ALLOW_NO_DB=true`。

### JWT验证失败

确保前端使用的Token有效，检查 `JWT_SECRET` 是否一致。

### 授权码验证失败

检查授权码格式是否为 `BABY-XXXX-XXXX-XXXX-XXXX`（16位）。

## 技术栈

- **框架:** Express.js 5.0
- **语言:** TypeScript 5.3
- **数据库:** PostgreSQL (Supabase)
- **ORM:** Prisma 5.0
- **认证:** JWT (jsonwebtoken)
- **验证:** Zod
- **日志:** Winston
- **安全:** Helmet, CORS
- **AI服务:** 智谱GLM-4.7
- **缓存:** Redis（可选）

## License

MIT
