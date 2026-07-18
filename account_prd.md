# 账户注册与管理 PRD

## 1. 背景

当前认知训练小游戏已经支持云端排行榜，排行榜数据存储在服务器 SQLite 数据库中。现阶段排行榜记录预留了 `username` 字段，但还没有账户体系，所有成绩无法明确归属到具体用户。

本需求希望增加账户注册、登录和基础账户管理能力，让用户的闯关记录、固定难度练习记录可以和账户绑定，并为后续个人历史记录、用户名展示、异常成绩处理和管理员能力打基础。

## 2. 目标

第一版账户系统目标：

- 支持用户注册账户。
- 支持用户登录、退出登录。
- 支持登录用户的排行榜成绩绑定到账户。
- 支持在排行榜记录中展示用户名。
- 支持用户查看和管理自己的基础账户信息。
- 保留未登录用户游玩能力，但未登录成绩不进入云端用户榜，或只作为本地临时记录。

不在第一版范围内：

- 第三方登录。
- 手机验证码登录。
- 邮箱验证。
- 找回密码。
- 好友系统。
- 头像上传。
- 多角色复杂权限系统。
- 完整后台管理系统。

## 3. 用户角色

### 3.1 游客

未登录用户。

能力：

- 可以进入所有游戏。
- 可以本地游玩。
- 可以查看云端排行榜。
- 不可以把成绩写入云端排行榜，或提交成绩前需要先登录。

### 3.2 注册用户

已注册并登录的普通用户。

能力：

- 可以提交闯关模式成绩。
- 可以提交固定难度模式成绩。
- 可以在排行榜中看到自己的用户名。
- 可以查看自己的账户信息。
- 可以修改用户名。
- 可以退出登录。

### 3.3 管理员，后续扩展

第一版不实现完整后台，但数据模型可以预留 `role` 字段。

后续能力：

- 查看用户列表。
- 禁用异常账户。
- 删除异常排行榜记录。

## 4. 核心用户流程

### 4.1 注册流程

1. 用户点击首页或导航栏的“注册/登录”入口。
2. 用户选择注册。
3. 用户填写：
   - 用户名
   - 密码
   - 确认密码
4. 前端校验基础格式。
5. 后端校验用户名是否已存在。
6. 后端加密保存密码。
7. 注册成功后自动登录，或跳转登录页。

推荐第一版：注册成功后自动登录。

### 4.2 登录流程

1. 用户打开登录弹窗或登录页。
2. 输入用户名和密码。
3. 后端校验密码。
4. 登录成功后返回登录凭证。
5. 前端保存登录状态。
6. 首页展示用户名和退出入口。

### 4.3 提交成绩流程

已登录用户：

1. 游戏结算时调用现有保存成绩逻辑。
2. 前端请求云端 API 时携带登录凭证。
3. 后端从登录凭证中识别用户。
4. 成绩写入数据库时同时保存：
   - `user_id`
   - `username`
5. 排行榜返回用户名和成绩。

未登录用户：

1. 游戏仍可正常游玩。
2. 结算成绩只保存在本地。
3. 结算弹窗提示：“登录后可保存到云端排行榜”。

### 4.4 修改用户名流程

1. 用户进入账户设置。
2. 修改用户名。
3. 后端校验新用户名是否可用。
4. 更新用户表。
5. 同步更新排行榜展示用户名，或排行榜查询时通过 `user_id` 关联用户表实时读取用户名。

推荐第一版：排行榜表保留 `username` 快照字段，同时也保存 `user_id`。修改用户名后同步更新排行榜表中的 `username`。

## 5. 页面与交互

### 5.1 首页导航区

未登录：

- 显示“登录”
- 显示“注册”

已登录：

- 显示用户名
- 显示“账户设置”
- 显示“退出”

### 5.2 登录/注册界面

可以做成弹窗，也可以做成独立页面。

推荐第一版：弹窗。

原因：

- 当前项目页面结构简单。
- 用户不需要离开游戏首页。
- 实现成本更低。

字段：

- 用户名
- 密码
- 确认密码，仅注册需要

基础校验：

- 用户名长度：2-20 个字符。
- 用户名允许：中文、英文、数字、下划线。
- 密码长度：至少 6 位。
- 注册时两次密码必须一致。

### 5.3 账户设置

第一版字段：

- 当前用户名
- 修改用户名
- 退出登录

暂不支持：

- 修改密码
- 删除账户
- 头像

### 5.4 排行榜展示

排行榜卡片后续可以展示：

- 游戏名称
- 最高记录
- 用户名

示例：

```text
数字记忆
最高：8 位
用户：Henry
```

如果记录来自旧数据或无用户名：

```text
用户：匿名
```

## 6. 数据模型

当前已有：

- `challenge_leaderboard`
- `fixed_leaderboard`

需要新增：

### 6.1 users

```sql
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

字段说明：

- `id`：用户 ID。
- `username`：用户名，唯一。
- `password_hash`：加密后的密码，不保存明文密码。
- `role`：用户角色，第一版默认 `user`。
- `created_at`：注册时间。
- `updated_at`：更新时间。

### 6.2 challenge_leaderboard 调整

当前表：

```sql
challenge_leaderboard (
  id,
  username,
  game_type,
  max_level,
  created_at,
  updated_at
)
```

建议调整为：

```sql
challenge_leaderboard (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  username TEXT NOT NULL DEFAULT '',
  game_type TEXT NOT NULL,
  max_level INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, game_type)
);
```

说明：

- 第一版账户体系上线后，排行榜应按 `user_id + game_type` 保存每个用户每个游戏的最高闯关记录。
- 如果需要保留“全站单项最高记录”，可以通过查询排序获得，而不是只在表里保存一条。

### 6.3 fixed_leaderboard 调整

当前表：

```sql
fixed_leaderboard (
  id,
  username,
  game_type,
  difficulty,
  question_count,
  best_accuracy,
  correct_count,
  total_count,
  created_at,
  updated_at
)
```

建议调整为：

```sql
fixed_leaderboard (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  username TEXT NOT NULL DEFAULT '',
  game_type TEXT NOT NULL,
  difficulty INTEGER NOT NULL,
  question_count INTEGER NOT NULL,
  best_accuracy REAL NOT NULL,
  correct_count INTEGER NOT NULL,
  total_count INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, game_type, difficulty, question_count)
);
```

说明：

- 每个用户在每个 `游戏 + 难度 + 题数` 下保留一个最高正确率。
- 查询排行榜时按 `best_accuracy DESC, updated_at ASC` 排序。

## 7. API 设计

### 7.1 注册

```text
POST /api/auth/register
```

请求：

```json
{
  "username": "Henry",
  "password": "123456"
}
```

响应：

```json
{
  "ok": true,
  "user": {
    "id": 1,
    "username": "Henry"
  },
  "token": "..."
}
```

### 7.2 登录

```text
POST /api/auth/login
```

请求：

```json
{
  "username": "Henry",
  "password": "123456"
}
```

响应：

```json
{
  "ok": true,
  "user": {
    "id": 1,
    "username": "Henry"
  },
  "token": "..."
}
```

### 7.3 获取当前用户

```text
GET /api/auth/me
```

请求头：

```text
Authorization: Bearer <token>
```

响应：

```json
{
  "id": 1,
  "username": "Henry",
  "role": "user"
}
```

### 7.4 修改用户名

```text
PATCH /api/auth/me
```

请求头：

```text
Authorization: Bearer <token>
```

请求：

```json
{
  "username": "HenryNew"
}
```

响应：

```json
{
  "ok": true,
  "user": {
    "id": 1,
    "username": "HenryNew"
  }
}
```

### 7.5 提交闯关成绩

沿用当前接口：

```text
POST /api/leaderboard/challenge
```

新增要求：

```text
Authorization: Bearer <token>
```

请求：

```json
{
  "gameType": "number-memory",
  "maxLevel": 8
}
```

后端逻辑：

- 从 token 中解析 `user_id`。
- 查询用户当前用户名。
- 写入 `user_id` 和 `username`。
- 只有新 `maxLevel` 更高时更新。

### 7.6 提交固定难度成绩

沿用当前接口：

```text
POST /api/leaderboard/fixed
```

新增要求：

```text
Authorization: Bearer <token>
```

请求：

```json
{
  "gameType": "number-memory",
  "difficulty": 6,
  "questionCount": 20,
  "accuracy": 85,
  "correctCount": 17,
  "totalCount": 20
}
```

后端逻辑：

- 从 token 中解析 `user_id`。
- 查询用户当前用户名。
- 写入 `user_id` 和 `username`。
- 只有新 `accuracy` 更高时更新。

## 8. 前端状态设计

新增前端模块：

```text
src/api/auth.ts
src/hooks/useAuth.ts
src/components/AuthModal.tsx
src/components/AccountMenu.tsx
```

### 8.1 useAuth

职责：

- 保存当前用户信息。
- 保存 token。
- 页面初始化时调用 `/api/auth/me` 校验登录状态。
- 提供 `login`、`register`、`logout`、`updateProfile` 方法。

token 存储：

- 第一版可以存在 `localStorage`。
- key 建议：`cognitive-games-auth-token`。

### 8.2 useBestScores 调整

当前逻辑：

- 页面加载读取云端排行榜。
- 结算时提交成绩。

账户版本调整：

- 未登录时不提交云端成绩，只保存本地临时成绩。
- 已登录时提交云端成绩，并携带 token。
- 登录成功后刷新排行榜。
- 退出登录后仍可以查看公共排行榜，但不再提交用户成绩。

## 9. 安全要求

第一版必须满足：

- 密码不能明文存储。
- 使用 `bcrypt` 或 `bcryptjs` 生成 `password_hash`。
- token 使用服务端签名，例如 JWT。
- token 设置过期时间，例如 7 天。
- 后端校验所有输入字段。
- 用户名需要做长度和字符限制。
- 登录失败返回统一错误，不暴露是用户名不存在还是密码错误。
- 注册和登录接口需要做基础限流，至少按 IP 做简单频率限制。

第一版可以暂缓：

- 邮箱验证。
- CSRF 防护，前提是 token 放在 Authorization header，而不是 cookie。
- 复杂风控。

## 10. 兼容旧数据

当前排行榜表中可能已有 `username = ''` 的全局记录。

推荐迁移策略：

1. 保留旧记录。
2. 增加 `user_id` 字段，旧记录 `user_id` 为空。
3. 排行榜查询时：
   - 用户榜只展示 `user_id IS NOT NULL` 的记录。
   - 如果需要展示历史全局记录，可以把 `user_id IS NULL` 显示为“匿名”。

第一版建议：

- 首页排行榜继续展示所有记录。
- 用户登录后的“我的记录”只展示该用户记录。

## 11. 验收标准

### 11.1 注册登录

- 用户可以注册新账户。
- 重复用户名注册失败。
- 密码错误登录失败。
- 登录成功后页面显示用户名。
- 刷新页面后登录状态保持。
- 退出登录后页面回到游客状态。

### 11.2 成绩归属

- 未登录用户完成游戏后，不写入云端用户榜。
- 已登录用户完成闯关后，数据库记录包含 `user_id` 和 `username`。
- 已登录用户完成固定难度练习后，数据库记录包含 `user_id` 和 `username`。
- 同一用户同一游戏闯关只保留最高关卡。
- 同一用户同一 `游戏 + 难度 + 题数` 只保留最高正确率。

### 11.3 排行榜展示

- 首页排行榜能展示云端记录。
- 排行榜记录能展示用户名。
- 旧匿名记录展示为“匿名”或不展示，取决于最终产品决策。

### 11.4 安全

- 数据库中不能出现明文密码。
- 未携带 token 时提交云端成绩失败。
- 伪造非法 token 时提交云端成绩失败。

## 12. 实施建议

建议分三步实现：

### 阶段一：账户基础能力

- 新增 `users` 表。
- 新增注册、登录、获取当前用户 API。
- 新增前端登录/注册弹窗。
- 首页展示登录状态。

### 阶段二：排行榜绑定账户

- 排行榜表增加 `user_id`。
- 提交成绩接口要求登录。
- 写入成绩时绑定 `user_id` 和 `username`。
- 排行榜展示用户名。

### 阶段三：账户管理

- 支持修改用户名。
- 同步更新排行榜用户名。
- 增加“我的记录”视图。

## 13. 待确认问题

1. 未登录用户的成绩是否允许进入云端匿名榜？
   - 推荐：不允许，避免无归属数据继续增加。

2. 注册字段是否只用用户名和密码？
   - 推荐第一版只用用户名和密码。

3. 排行榜首页展示“全站第一名”还是“当前用户个人记录”？
   - 推荐：首页展示全站榜；登录后可额外展示“我的记录”。

4. 是否需要管理员账号？
   - 推荐第一版只预留 `role` 字段，不做管理后台。

5. 修改用户名后，历史排行榜是否同步改名？
   - 推荐同步改名，减少用户困惑。
