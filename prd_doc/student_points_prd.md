# 学生每日积分记录 PRD

## 1. 背景

当前网站已经具备账户体系，账户角色区分为：

- `student`：学生
- `admin`：管理员

本需求希望在现有网站中增加“学生每日积分记录”功能，让学生可以每天登记学习、阅读、作文、家务等项目获得的星星数；学生和管理员都可以查看每日明细、每日总数和累计总数；管理员可以编辑学生的星星记录。

## 2. 目标

第一版目标：

- 学生可以登记每日积分。
- 积分项目固定包括：数学、英语、读书、作文、家务、其他。
- 学生登记时可以选择项目和星星数。
- 选择“其他”时，学生必须填写具体内容。
- 学生和管理员都可以查看每日积分记录。
- 页面展示：
  - 每天每个项目的星星个数。
  - 每天星星总数。
  - 从有记录以来累计到现在的星星总数。
- 管理员可以编辑学生的星星数和备注内容。

不在第一版范围：

- 星星兑换奖品。
- 多学生班级管理。
- 家长角色。
- 积分审批流。
- 图片上传凭证。
- 删除账号。
- 复杂统计图表。

## 3. 用户角色与权限

### 3.1 Student

学生用户，`role = 'student'`。

权限：

- 可以新增自己的每日积分记录。
- 可以查看自己的每日积分明细。
- 可以查看自己的每日总星星数。
- 可以查看自己的累计总星星数。
- 可以编辑自己当天未被管理员锁定的记录，是否允许编辑需在实现前确认。

第一版推荐：

- 学生可以新增记录。
- 学生不允许编辑历史记录。
- 如果填错，由管理员修改。

### 3.2 Admin

管理员用户，`role = 'admin'`。

权限：

- 可以查看所有学生的每日积分记录。
- 可以按学生筛选记录。
- 可以编辑任意学生的积分记录：
  - 项目
  - 星星数
  - 其他项目说明
  - 备注
- 可以新增学生的补录记录。

第一版不做：

- 删除记录，除非后续明确需要。
- 角色管理界面。

## 4. 积分项目规则

积分项目固定为：

```text
数学
英语
读书
作文
家务
其他
```

### 4.1 数学

说明：

```text
计算小超市，每天最少 1 页，最多 3 页。所有题目全对积 1 颗星。
```

登记方式：

- 学生选择“数学”。
- 学生填写星星数。
- 第一版不强制校验页数，只展示规则说明。

建议星星数范围：

```text
0-3
```

### 4.2 英语

说明：

```text
每天读英语 30 分钟，抄写 10 个不会的单词，积 1 颗星；背诵 10 个不会的单词，积 2 颗星。
```

登记方式：

- 学生选择“英语”。
- 学生填写星星数。
- 第一版不强制区分“抄写”和“背诵”，可在备注中填写。

建议星星数范围：

```text
0-3
```

### 4.3 读书

说明：

```text
每天读书 45 分钟，写一句读后感，积 1 颗星；每多读 30 分钟，多积 1 颗星。
```

登记方式：

- 学生选择“读书”。
- 学生填写星星数。
- 可在备注中填写读后感。

建议星星数范围：

```text
0-10
```

### 4.4 作文

说明：

```text
每写 1 篇作文，积 10 颗星。
```

登记方式：

- 学生选择“作文”。
- 学生填写星星数。
- 第一版不强制星星数必须是 10 的倍数，但建议前端提示。

建议星星数范围：

```text
0-50
```

### 4.5 家务

说明：

```text
洗内裤 1 颗星、洗袜子 1 颗星、洗碗 1 颗星，其他由爷爷奶奶姥姥姥爷酌情发星。
```

登记方式：

- 学生选择“家务”。
- 学生填写星星数。
- 建议在备注中填写具体家务内容。

建议星星数范围：

```text
0-10
```

### 4.6 其他

说明：

```text
由学生填写具体内容。
```

登记方式：

- 学生选择“其他”。
- 页面弹出或展示一个输入框。
- 学生必须填写具体内容。
- 学生填写星星数。

校验：

- `其他` 项目的具体内容不能为空。
- 具体内容长度建议限制为 1-100 个字符。

## 5. 页面设计

### 5.1 入口

建议在首页账户区域增加入口：

```text
我的积分
```

显示条件：

- 已登录用户可见。
- `student` 和 `admin` 都可进入。
- 未登录用户点击时提示先登录。

路由建议：

```text
/points
```

### 5.2 学生视角

页面模块：

1. 今日登记卡片
2. 今日汇总
3. 历史记录列表
4. 累计总星星数

#### 今日登记卡片

字段：

- 日期，默认今天。
- 积分项目。
- 项目规则说明。
- 星星数。
- 备注。
- 其他项目具体内容，仅选择“其他”时出现。

按钮：

```text
提交积分
```

提交成功后：

- 刷新当天记录。
- 刷新累计总数。
- 清空表单。

#### 今日汇总

展示当天每个项目星星数：

```text
数学：1
英语：2
读书：1
作文：0
家务：2
其他：0
今日总计：6
```

#### 历史记录列表

按日期倒序展示：

```text
2026-07-19
数学 1 星
英语 2 星
今日总计 3 星

2026-07-18
读书 2 星
家务 1 星
今日总计 3 星
```

#### 累计总星星数

展示：

```text
累计星星：128
```

### 5.3 管理员视角

管理员进入 `/points` 后，可以看到：

- 学生筛选器。
- 日期筛选器。
- 每日积分记录表。
- 累计总星星数。

第一版如果只有少量学生，可以用简单下拉选择学生：

```text
学生：全部 / henry / bessie / ...
```

管理员记录表字段：

- 日期
- 学生用户名
- 项目
- 星星数
- 其他内容
- 备注
- 创建时间
- 更新时间
- 编辑按钮

编辑弹窗字段：

- 项目
- 星星数
- 其他内容
- 备注

管理员保存后：

- 更新该条记录。
- 页面刷新每日总数和累计总数。

## 6. 数据模型

建议新增一张表：

```sql
CREATE TABLE IF NOT EXISTS student_point_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_user_id INTEGER NOT NULL,
  student_username TEXT NOT NULL,
  category TEXT NOT NULL,
  stars INTEGER NOT NULL,
  record_date TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  created_by_user_id INTEGER NOT NULL,
  updated_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(student_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(created_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(updated_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);
```

字段说明：

- `student_user_id`：积分所属学生用户 ID。
- `student_username`：学生用户名快照，方便展示。
- `category`：积分项目，取值为 `math`、`english`、`reading`、`writing`、`housework`、`other`。
- `stars`：星星数，整数。
- `record_date`：积分日期，格式 `YYYY-MM-DD`。
- `detail`：具体内容，主要用于“其他”，也可用于家务细节。
- `note`：备注。
- `created_by_user_id`：创建记录的人，学生自己或管理员。
- `updated_by_user_id`：最后修改记录的人。

索引建议：

```sql
CREATE INDEX IF NOT EXISTS idx_student_point_records_student_date
ON student_point_records(student_user_id, record_date);

CREATE INDEX IF NOT EXISTS idx_student_point_records_date
ON student_point_records(record_date);
```

### 6.1 是否允许同一天同项目多条记录

推荐第一版：允许。

原因：

- 英语可能既有抄写又有背诵。
- 家务可能一天多次。
- 其他项目天然需要多条。

汇总展示时按 `student_user_id + record_date + category` 聚合即可。

## 7. API 设计

### 7.1 获取积分项目配置

```text
GET /api/points/categories
```

响应：

```json
[
  {
    "id": "math",
    "name": "数学",
    "description": "计算小超市，每天最少 1 页，最多 3 页。所有题目全对积 1 颗星。"
  }
]
```

也可以第一版直接写在前端常量中，不单独做 API。

推荐第一版：前端常量。

### 7.2 新增积分记录

```text
POST /api/points/records
```

权限：

- `student`：只能给自己新增。
- `admin`：可以给任意学生新增。

请求：

```json
{
  "studentUserId": 1,
  "recordDate": "2026-07-19",
  "category": "math",
  "stars": 1,
  "detail": "",
  "note": ""
}
```

学生自己提交时：

- 可以不传 `studentUserId`。
- 后端使用 token 中的用户 ID。

校验：

- 必须登录。
- `stars` 必须是整数。
- `stars` 范围建议为 `0-100`。
- `category` 必须是合法项目。
- `recordDate` 必须是 `YYYY-MM-DD`。
- 如果 `category = 'other'`，`detail` 必填。

响应：

```json
{
  "ok": true,
  "record": {
    "id": 1,
    "studentUserId": 1,
    "studentUsername": "henry",
    "recordDate": "2026-07-19",
    "category": "math",
    "stars": 1,
    "detail": "",
    "note": ""
  }
}
```

### 7.3 查询积分记录

```text
GET /api/points/records
```

权限：

- `student`：只能查询自己的记录。
- `admin`：可以查询所有学生记录，也可以按学生筛选。

查询参数：

```text
studentUserId
from
to
limit
```

示例：

```text
GET /api/points/records?from=2026-07-01&to=2026-07-31
```

响应：

```json
{
  "records": [
    {
      "id": 1,
      "studentUserId": 1,
      "studentUsername": "henry",
      "recordDate": "2026-07-19",
      "category": "math",
      "stars": 1,
      "detail": "",
      "note": ""
    }
  ]
}
```

### 7.4 查询积分汇总

```text
GET /api/points/summary
```

权限：

- `student`：只能查自己。
- `admin`：可以查任意学生或全部学生。

查询参数：

```text
studentUserId
from
to
```

响应：

```json
{
  "dailySummaries": [
    {
      "recordDate": "2026-07-19",
      "byCategory": {
        "math": 1,
        "english": 2,
        "reading": 1,
        "writing": 0,
        "housework": 2,
        "other": 0
      },
      "totalStars": 6
    }
  ],
  "totalStars": 128
}
```

### 7.5 管理员编辑积分记录

```text
PATCH /api/points/records/:id
```

权限：

- 仅 `admin`。

请求：

```json
{
  "category": "english",
  "stars": 2,
  "detail": "背诵 10 个单词",
  "note": "管理员调整"
}
```

响应：

```json
{
  "ok": true
}
```

### 7.6 学生列表

```text
GET /api/points/students
```

权限：

- 仅 `admin`。

响应：

```json
[
  {
    "id": 1,
    "username": "henry"
  }
]
```

## 8. 前端模块建议

新增文件建议：

```text
src/api/points.ts
src/pages/Points.tsx
src/components/PointRecordForm.tsx
src/components/PointSummaryPanel.tsx
src/components/PointRecordList.tsx
src/data/pointCategories.ts
```

### 8.1 pointCategories

前端维护积分项目配置：

```ts
export const pointCategories = [
  {
    id: 'math',
    name: '数学',
    description: '计算小超市，每天最少 1 页，最多 3 页。所有题目全对积 1 颗星。',
  },
]
```

### 8.2 Points 页面

职责：

- 判断当前用户角色。
- `student` 显示自己的登记和汇总。
- `admin` 显示学生筛选、记录列表和编辑入口。
- 统一展示每日明细、每日总数和累计总数。

## 9. 安全与权限要求

必须满足：

- 所有 `/api/points/*` 写接口必须要求登录。
- 后端必须从 token 判断当前用户角色，不信任前端传入的 role。
- `student` 不能替其他学生新增积分。
- `student` 不能调用管理员编辑接口。
- `admin` 可以编辑学生积分。
- 后端校验 `stars`、`category`、`recordDate`、`detail`。

## 10. 兼容与部署

需要新增数据库迁移脚本：

```text
scripts/migrate-student-points-db.mjs
```

脚本职责：

- 创建 `student_point_records` 表。
- 创建必要索引。
- 可以重复执行。

服务器部署步骤建议：

```bash
cd /var/www/henry_games
git pull origin main
npm install
npm install --prefix server
node scripts/migrate-account-db.mjs
node scripts/migrate-student-points-db.mjs
npm run build
pm2 restart henry-games-api
```

## 11. 验收标准

### 11.1 学生登记

- 学生登录后可以进入 `/points`。
- 学生可以选择积分项目。
- 页面能展示对应项目说明。
- 学生可以填写星星数并提交。
- 选择“其他”时，必须填写具体内容。
- 提交成功后，今日汇总和累计总数刷新。

### 11.2 学生查看

- 学生只能看到自己的积分记录。
- 学生可以看到每天每个项目星星数。
- 学生可以看到每天星星总数。
- 学生可以看到累计总星星数。

### 11.3 管理员查看与编辑

- 管理员可以进入 `/points`。
- 管理员可以看到学生筛选器。
- 管理员可以查看学生积分记录。
- 管理员可以编辑学生星星数。
- 管理员编辑后，汇总数据正确刷新。

### 11.4 权限

- 未登录访问 `/points` 时提示登录。
- 未登录调用积分 API 返回 401。
- 学生调用管理员编辑 API 返回 403。
- 学生尝试给其他学生新增积分返回 403。

## 12. 待确认问题

1. 学生是否允许修改自己当天的积分？
   - 推荐第一版不允许，由管理员修改。

2. 是否需要删除积分记录？
   - 推荐第一版不做删除，只做编辑。

3. 管理员是否需要给学生补录历史日期？
   - 推荐允许。

4. 积分星星数是否允许为 0？
   - 推荐允许，方便记录完成情况但不加星。

5. 作文星星数是否必须是 10 的倍数？
   - 推荐第一版只提示，不强制。

6. 是否需要展示月度统计？
   - 推荐第一版先不做，后续再加。
