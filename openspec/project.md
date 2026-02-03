# Project Context

## Purpose

一款基于智谱AI大模型的移动端宝宝起名Web应用，采用"一客一码"付费授权模式。

**核心价值**：
- 用户价值：省时省力、专业可靠、寓意深远、文化底蕴
- 商业价值：一客一码变现模式、低成本高利润、易复制推广
- 技术价值：AI驱动、智能化程度高、可快速迭代

**目标用户**：准爸妈（孕期准备）、新生儿家长、改名需求者

**价格定位**：中等价位（¥29-99/次），服务追求品质但预算有限的年轻父母

---

## Tech Stack

### Frontend
| 技术 | 版本 | 用途 |
|------|------|------|
| **Vue 3** | ^3.4.0 | 核心框架，组合式 API |
| **TypeScript** | ^5.3.0 | 类型安全开发 |
| **Vite** | ^5.0.0 | 构建工具 |
| **Vant 4** | ^4.0.0 | 移动端 UI 组件库 |
| **Pinia** | ^2.1.0 | 状态管理 |
| **Axios** | ^1.6.0 | HTTP 客户端 |
| **Vue Router** | ^4.2.0 | 路由管理 |

### Backend
| 技术 | 版本 | 用途 |
|------|------|------|
| **Node.js** | 20 LTS | 运行时环境 |
| **TypeScript** | ^5.3.0 | 类型安全开发 |
| **Express.js** | ^5.0.0 | Web 框架 |
| **Prisma** | ^5.0.0 | ORM 数据访问层 |
| **Supabase PostgreSQL** | - | 主数据库（托管） |

### AI Services
| 服务 | 用途 |
|------|------|
| **智谱 AI (GLM-4-Flash)** | 名字生成 AI 服务 |
| API URL | `https://open.bigmodel.cn/api/paas/v4/chat/completions` |

### Security & Infrastructure
| 技术 | 用途 |
|------|------|
| **JWT** | 令牌认证 |
| **bcrypt** | 密码加密 |
| **Helmet** | 安全头部 |
| **express-rate-limit** | 请求限流 |
| **Winston** | 日志管理 |
| **Zod** | 数据验证 |

---

## Project Conventions

### Code Style

#### 命名约定
| 类型 | 约定 | 示例 |
|------|------|------|
| **文件名** | kebab-case | `auth.service.ts`, `name.controller.ts` |
| **组件名** | PascalCase（Vue） | `AuthView.vue`, `NameCard.vue` |
| **变量/函数** | camelCase | `usageCount`, `generateNames()` |
| **类/接口/类型** | PascalCase | `AuthService`, `NameRequest` |
| **常量** | UPPER_SNAKE_CASE | `MAX_USAGE`, `JWT_SECRET` |
| **数据库表** | snake_case | `authorization_code`, `usage_record` |

#### TypeScript 规范
- 优先使用 `interface` 定义对象结构
- 优先使用 `type` 定义联合类型、交叉类型
- 避免使用 `any`，使用 `unknown` 替代
- 函数参数/返回值必须显式声明类型
- 启用严格模式（`strict: true`）

#### Vue 3 规范
- 使用 `<script setup>` 语法糖
- 组合式 API（Composition API）
- Props 使用 `defineProps` + TypeScript 类型
- Emits 使用 `defineEmits` + TypeScript 类型
- 响应式数据优先使用 `ref`，对象使用 `reactive`

#### 格式化
- 使用 **Prettier** 格式化（2 空格缩进）
- 使用 **ESLint** 检查代码质量
- 每行最大长度：100 字符
- 尾随逗号：ES5 风格（对象/数组最后元素加逗号）

---

### Architecture Patterns

#### 分层架构（后端）

```
Controllers → Services → Repositories → Prisma ORM → Database
     ↓            ↓              ↓
  请求处理    业务逻辑编排    数据访问封装
```

**职责划分**：
- **Controllers（控制器）**：处理 HTTP 请求/响应，参数解析
- **Services（服务）**：业务逻辑编排，跨领域协作
- **Repositories（仓储）**：数据库操作封装，Prisma 调用

#### 前端架构

```
Views（页面）→ Components（组件）→ Stores（状态）→ API（请求）
```

**目录结构**：
```
src/
├── views/          # 页面组件（路由级别）
├── components/     # 可复用组件
├── stores/         # Pinia 状态管理
├── api/            # API 封装
├── router/         # 路由配置
├── utils/          # 工具函数
└── types/          # TypeScript 类型
```

#### API 设计规范

**响应格式**（统一）：
```typescript
// 成功响应
{
  success: true,
  data: { ... }
}

// 错误响应
{
  success: false,
  error: {
    code: "ERROR_CODE",
    message: "用户友好的错误描述"
  }
}
```

**HTTP 状态码约定**：
- `200` - 成功
- `400` - 请求参数错误
- `401` - 未认证
- `403` - 无权限
- `404` - 资源不存在
- `429` - 请求过于频繁（限流）
- `500` - 服务器内部错误

#### 中间件链（后端）

```
CORS → Helmet → Logger → Rate Limit → Validate → Auth → Controller → Error Handler
```

---

### Testing Strategy

#### 测试层级
| 层级 | 工具 | 覆盖率目标 | 说明 |
|------|------|------------|------|
| **单元测试** | Vitest | >80% | 服务层、工具函数 |
| **集成测试** | Vitest + Supertest | >60% | API 端点 |
| **E2E 测试** | Playwright | 核心流程 | 关键用户旅程 |

#### 测试文件位置
```
backend/
├── src/
│   └── auth.service.ts
└── __tests__/
    └── auth.service.test.ts

frontend/
├── src/
│   └── views/
│       └── AuthView.vue
└── __tests__/
    └── AuthView.test.ts
```

#### 测试命名约定
- 文件名：`*.test.ts` 或 `*.spec.ts`
- 测试描述：`should <行为> when <条件>`

---

### Git Workflow

#### 分支策略
```
main         ← 生产环境，仅接受 merge/PR
  ↑
develop      ← 开发环境，集成分支
  ↑
feature/*    ← 功能分支（从 develop 创建）
```

#### 分支命名
- `feature/功能描述` - 新功能开发（如 `feature/auth-code-validation`）
- `fix/问题描述` - Bug 修复（如 `fix/ai-timeout-error`）
- `refactor/模块描述` - 重构（如 `refactor/service-layer`）
- `docs/文档说明` - 文档更新

#### Commit 约定（Conventional Commits）
```
<type>(<scope>): <subject>

<body>

<footer>
```

**类型（type）**：
- `feat` - 新功能
- `fix` - Bug 修复
- `docs` - 文档更新
- `style` - 代码格式（不影响功能）
- `refactor` - 重构
- `test` - 测试相关
- `chore` - 构建/工具链更新

**示例**：
```
feat(auth): add authorization code validation

- Implement format validation (19-character format)
- Add device binding on first activation
- Generate JWT token with 90-day expiry

Closes #123
```

---

## Domain Context

### 业务概念

| 概念 | 说明 |
|------|------|
| **授权码** | 19 位格式（XXXX-XXXX-XXXX-XXXX-XXXX），用户购买后激活使用 |
| **设备绑定** | 授权码首次激活时绑定设备指纹，防止共享 |
| **使用次数** | 每个授权码有最大使用次数限制（默认 10 次） |
| **AI 起名** | 调用智谱 AI 根据宝宝信息生成 5 个精选名字 |
| **名字解析** | 每个名字包含寓意、拼音、出处、五行分析、评分 |

### 授权码状态流转
```
UNUSED → ACTIVE → EXPIRED
   ↓
(首次激活)
   ↓
绑定 deviceId
```

### AI 起名标准
1. **寓意美好**：名字要有积极的寓意和内涵
2. **音律和谐**：声调搭配，朗朗上口，无不好谐音
3. **字形美观**：结构匀称，书写流畅
4. **文化底蕴**：优先从诗词典故中取材
5. **时代感**：既要有传统底蕴，又要符合现代审美
6. **避免生僻**：使用 GB2312 常用字

---

## Important Constraints

### 技术约束
| 约束 | 说明 |
|------|------|
| **移动端优先** | UI/UX 专为手机屏幕优化 |
| **无用户注册** | 仅授权码激活，不需要账户系统 |
| **设备独占** | 授权码绑定单一设备 |
| **次数限制** | 授权码使用次数上限 |

### 商业约束
| 约束 | 说明 |
|------|------|
| **一客一码** | 每个授权码仅限一个设备使用 |
| **时效性** | 授权码有有效期（默认 90 天） |
| **定价** | ¥29-99/次，中等价位 |

### 数据约束
- 仅收集必要信息：宝宝基本信息、设备标识
- 不收集敏感个人信息
- 数据存储期限：授权码过期后 30 天删除
- 不与第三方共享数据

---

## External Dependencies

### Supabase PostgreSQL
- **项目 ID**：`puzbruleuezupsfxpusm`
- **区域**：`aws-0-us-east-1`
- **用途**：主数据库（授权码、使用记录、管理员、埋点事件）
- **连接**：Transaction Pooler（端口 6543）

### 智谱 AI
- **API Key**：存储在环境变量 `ZHIPU_API_KEY`
- **模型**：`glm-4-flash`
- **超时**：30 秒
- **降级策略**：API 失败时提示用户稍后重试

### 环境变量（必需）
```bash
# 数据库
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# JWT
JWT_SECRET="强密钥，生产环境必须更换"
JWT_EXPIRES_IN="90d"

# 智谱 AI
ZHIPU_API_KEY="xxx.xxx"
ZHIPU_API_URL="https://open.bigmodel.cn/api/paas/v4/chat/completions"

# 前端地址
FRONTEND_URL="http://localhost:5178"

# 限流
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

---

## API Endpoints

### 认证
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/validate` | 验证授权码，返回 JWT |
| GET | `/api/auth/status` | 查询授权状态（需认证） |

### 起名
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/name/generate` | AI 生成名字（需认证） |
| GET | `/api/name/history` | 获取历史记录（需认证，V2.0） |

### 健康
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/health` | 服务健康状态 |
| GET | `/` | API 信息 |

---

## File Locations

### 关键文件
| 文件 | 路径 |
|------|------|
| Prisma Schema | `backend/prisma/schema.prisma` |
| 后端入口 | `backend/src/server.ts` |
| 前端入口 | `前端代码/.../src/main.ts` |
| 环境变量示例 | `backend/.env.example` |
| 后端方案 | `后端方案.md` |
| 产品需求 | `PRD-产品需求文档.md` |

---

## OpenSpec Workflow

本项目使用 OpenSpec 进行规格驱动的开发：

1. **变更提案**：`openspec/changes/<change-id>/` 存放待实现的变更
2. **规格文档**：`openspec/specs/<capability>/spec.md` 存放已实现的功能规格
3. **项目上下文**：`openspec/project.md`（本文件）

详细工作流程见 [AGENTS.md](openspec/AGENTS.md)
