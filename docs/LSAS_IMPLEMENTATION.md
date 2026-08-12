# LSAS 社交焦虑量表实现文档

> Liebowitz Social Anxiety Scale（LSAS）社交焦虑量表的完整实现说明，涵盖**代码组件设计与功能**、**题型与计分规则**两部分。

## 目录

1. [第一部分：代码组件设计与功能](#第一部分代码组件设计与功能)
2. [第二部分：题型与计分规则](#第二部分题型与计分规则)
3. [数据流总览](#数据流总览)

---

## 第一部分：代码组件设计与功能

### 1.1 功能入口与页面

| 文件 | 路径 | 职责 |
|------|------|------|
| 量表作答页 | `src/routes/lsas.tsx` | `/quiz/lsas` 路由页面：加载题库、作答、进度展示、提交校验、结果报告 |
| 题库列表入口 | `src/routes/quiz.tsx` | 在「测试题」页新增 LSAS 量表卡片，点击跳转 `/quiz/lsas` |
| 路由注册 | `src/App.tsx` | 新增 `<Route path="quiz/lsas" element={<LsasPage />} />` |

### 1.2 题库数据层

**文件**：`public/lsas.json`（独立于测验题库 `quiz-bank.json`）

```jsonc
{
  "meta": {
    "title": "Liebowitz 社交焦虑量表",
    "description": "……",
    "scoring": { "mode": "lsas" },
    // 维度选项定义在 meta，全量表共用一套等级
    "fearOptions": [
      { "value": 0, "label": "无" },
      { "value": 1, "label": "轻度" },
      { "value": 2, "label": "中度" },
      { "value": 3, "label": "重度" }
    ],
    "avoidanceOptions": [
      { "value": 0, "label": "从不 (0%)" },
      { "value": 1, "label": "偶尔 (1-33%)" },
      { "value": 2, "label": "经常 (34-67%)" },
      { "value": 3, "label": "通常 (68-100%)" }
    ]
  },
  "questions": [
    { "id": 1, "subscale": "si", "scenario": "在公共场合使用电话" },
    { "id": 2, "subscale": "si", "scenario": "参加小组活动" },
    // …共 24 个场景，每题含 subscale（si/ps）字段
  ]
}
```

**类型**：`src/data/quizBank.ts`

```ts
export interface LsasBank {
  meta: QuizBankMeta      // 含 scoring.mode: 'lsas' 与维度选项
  questions: (LsasQuestionProps & { id: number })[]
}
```

- `QuizBankMeta` 扩展了 `fearOptions` / `avoidanceOptions` 两个维度选项字段
- `fetchLsasBank()` 通过通用 `fetchBank<T>(url)` 加载 `/lsas.json`

### 1.3 题型组件（复用与新增）

| 组件 | 文件 | 设计 |
|------|------|------|
| `OptionList`（新增·通用） | `src/components/quiz/OptionList.tsx` | 通用选项按钮组，支持 `vertical`（纵向全宽）/ `horizontal`（横向等分）两种布局，内置选中态、对错高亮、圆形单选指示；单选/多选/LSAS 复用 |
| `LsasQuestion`（新增） | `src/components/quiz/LsasQuestion.tsx` | LSAS 单场景卡片：**完全受控组件**，两个维度各一行横向 0-3 等级按钮（复用 `OptionList`），SI/PS 彩色徽标 +「已完成/未完成」状态指示 + 未选维度「请选择」提示 |
| `LsasReport`（新增） | `src/components/quiz/LsasReport.tsx` | 结果报告：总分环形进度（满刻 144）+ 等级徽章 + 解读文案 + 4 个因子得分卡 + 免责声明 + 重新测试 |
| `SingleChoiceQuestion`（重构） | `src/components/quiz/SingleChoiceQuestion.tsx` | `correctOptionId` 改为可选，支持「纯选择模式」；`badge` 自定义徽标；内部复用 `OptionList` |

**`LsasQuestion` 设计要点（完全受控）**：

```tsx
export function LsasQuestion({ scenario, subscale, fearOptions, avoidanceOptions, onChange, value }) {
  // 不维护内部 state，选中态完全由 value 驱动
  const answer = value ?? { fear: null, avoidance: null }

  const handleChange = (patch: Partial<LsasAnswer>) => {
    onChange?.({ ...answer, ...patch })  // 基于最新 value 合并，避免陈旧闭包
  }
  // 每个维度渲染：
  // <OptionList layout="horizontal" selectedId={String(answer.fear)} onSelect={...} />
}
```

> 修复历史：早期版本使用内部 state + `useEffect` 同步，点击第二维度时基于过期闭包合并导致答案丢失、提交时误报"还有 24 个场景未完成"。改为完全受控后彻底解决。

### 1.4 答题页逻辑（`src/routes/lsas.tsx`）

```
加载题库 → 逐题作答（onChange 上报 answers[q.id]）
        → 进度条（已答/24）
        → 提交校验（每题两维度齐全）
        → getLsasScore() 计算
        → LsasReport 展示
        → 重新测试 / 清空重答
```

- **作答态**：`answers: Record<number, LsasAnswer>`，`LsasAnswer = { fear: number|null, avoidance: number|null }`
- **`isAnswered`** 统一判空：`answer != null && answer.fear != null && answer.avoidance != null`
- **提交校验**：未完成时提示「还有 N 个场景未完成作答（每题需选择「恐惧/焦虑」和「回避」两个维度）」
- **防竞态**：加载用 `cancelled` 标记，卸载后不 setState

### 1.5 报告组件（`LsasReport`）

| 区块 | 内容 |
|------|------|
| 环形总分 | SVG 圆环动画，`total / 144` 比例，数字滚动到总分 |
| 等级徽章 | 根据 `levelInfo.level` 着色（成功/警告/错误）并显示标签 |
| 解读文案 | `levelInfo.description` |
| 因子得分卡 | 4 格：恐惧总分(0-72)、回避总分(0-72)、社交互动 SI(0-66)、表演 PS(0-78) |
| 免责声明 | 「仅供自我评估参考，不构成医学诊断」 |

### 1.6 相关文件清单

```
src/
├── routes/lsas.tsx                  # 量表作答页（新增）
├── routes/quiz.tsx                  # 题库列表页（增加 LSAS 入口卡片）
├── components/quiz/
│   ├── LsasQuestion.tsx             # 量表单题组件（新增）
│   ├── LsasReport.tsx               # 量表报告组件（新增）
│   ├── OptionList.tsx               # 通用选项组件（新增）
│   ├── SingleChoiceQuestion.tsx     # 单选组件（重构支持纯选择模式）
│   ├── types.ts                     # 类型扩展（LsasAnswer/LsasSubscale 等）
│   └── index.ts                     # 桶文件导出
├── lib/scoring-lsas.ts              # LSAS 专属计分器（新增）
├── data/quizBank.ts                 # 数据加载（fetchLsasBank）
└── App.tsx                          # 路由注册
public/lsas.json                     # LSAS 题库数据（新增）
```

---

## 第二部分：题型与计分规则

### 2.1 量表结构（LSAS 标准）

- **共 24 个社交场景**，每个场景从**两个维度**评估：
  - **恐惧 / 焦虑**（Fear/Anxiety）：对该场景的紧张程度
  - **回避**（Avoidance）：对该场景的回避程度
- 每个维度 4 级选项（0-3 分）：

| 维度 | 0 | 1 | 2 | 3 |
|------|---|---|---|---|
| 恐惧/焦虑 | 无 | 轻度 | 中度 | 重度 |
| 回避 | 从不 (0%) | 偶尔 (1-33%) | 经常 (34-67%) | 通常 (68-100%) |

### 2.2 因子（子量表）划分

24 题分为两个因子，`subscale` 字段标记：

| 因子 | 名称 | 题数 | 题号 |
|------|------|------|------|
| **SI** | 社交互动 Social Interaction | 11 | 1, 2, 5, 8, 9, 10, 11, 12, 14, 19, 24 |
| **PS** | 表演 Performance | 13 | 3, 4, 6, 7, 13, 15, 16, 17, 18, 20, 21, 22, 23 |

### 2.3 计分规则

| 得分项 | 计算方式 | 满分 |
|--------|----------|------|
| 恐惧总分 | Σ 所有题目的 fear（0-3） | 0–72 |
| 回避总分 | Σ 所有题目的 avoidance（0-3） | 0–72 |
| **LSAS 总分** | 恐惧总分 + 回避总分 | **0–144** |
| SI 因子分 | Σ SI 题目的（fear + avoidance） | 0–66 |
| PS 因子分 | Σ PS 题目的（fear + avoidance） | 0–78 |

未作答维度按 0 计分。

### 2.4 等级判定（总分 0-144）

| 总分区间 | 等级 | 解读 |
|----------|------|------|
| 0 – 29 | 无明显社交焦虑 | 未表现出明显社交焦虑症状 |
| 30 – 59 | 轻度社交焦虑 | 可能存在轻度社交焦虑，建议关注 |
| 60 – 89 | 中度社交焦虑 | 明显社交焦虑，建议专业评估 |
| 90 – 144 | 重度社交焦虑 | 显著社交焦虑，建议尽快专业帮助 |

> 注：总分 ≥ 30 是国际上判断可能符合社交焦虑障碍（SAD）的常用切点。

### 2.5 计分器实现（`src/lib/scoring-lsas.ts`）

独立于通用测验计分器 `src/lib/scoring.ts`，实现 LSAS 专属求和逻辑：

```ts
export function getLsasScore(
  questions: { subscale: LsasSubscale }[],
  answers: Record<number, LsasAnswer | undefined>
): LsasScoreResult {
  // 遍历每题：
  //   fearTotal += fear          → 恐惧总分
  //   avoidanceTotal += avoidance → 回避总分
  //   q.subscale === 'si' ? siScore += (fear + avoidance) : psScore += ...
  //   answered 判断两维度齐全
  // total = fearTotal + avoidanceTotal
  // 匹配 LSAS_LEVELS 区间 → levelInfo
}
```

核心类型：

```ts
export interface LsasScoreResult {
  total: number            // LSAS 总分（0-144）
  fearTotal: number        // 恐惧总分（0-72）
  avoidanceTotal: number   // 回避总分（0-72）
  siScore: number          // SI 社交互动因子分（0-66）
  psScore: number          // PS 表演因子分（0-78）
  answeredCount: number    // 已作答题数
  level: LsasLevel         // none | mild | moderate | severe
  levelInfo: LsasLevelInfo // 等级标签与解读文案
  perQuestion: LsasPerQuestionScore[] // 每题明细
}
```

### 2.6 与通用测验计分的区别

| 维度 | 通用测验（quiz-bank） | LSAS 量表（lsas） |
|------|----------------------|-------------------|
| 题型 | 单选/多选/排序 | 双维度等级量表 |
| 答案 | 有标准答案、对错判定 | 无对错，采集程度分数 |
| 计分 | exact 全对全错 / weighted 选项加权 → 归一化**百分制** | **求和**（0-144 原始分） |
| 子量表 | 无 | SI（11 题）/ PS（13 题） |
| 报告 | 得分 + 及格判定 + 对错统计 | 总分 + 因子分 + 四级解读 + 免责声明 |

---

## 数据流总览

```
public/lsas.json
   │  fetchLsasBank()  ← src/data/quizBank.ts
   ▼
src/routes/lsas.tsx
   │  渲染 LsasQuestion（完全受控，onChange 上报）
   ▼
answers: Record<number, LsasAnswer>   ← { fear, avoidance } (0-3)
   │  提交校验（isAnswered 两维度齐全）
   ▼
getLsasScore()  ← src/lib/scoring-lsas.ts
   │  求和 → 恐惧/回避/SI/PS → 等级匹配
   ▼
LsasReport      ← 环形总分 + 因子得分卡 + 等级解读 + 免责声明
```

---

## 验证

- `npm run typecheck` ✅
- `npm run build` ✅（1921 modules）
- lint 无错误
- 访问路径：首页 `/` → 测试题 `/quiz` → 「LSAS 社交焦虑量表」卡片 → `/quiz/lsas`





# LSAS 社交焦虑评估系统：分析原理与体系设计规范

## 一、 核心测量理论与模型

本测试基于 **Liebowitz 社交焦虑量表（Liebowitz Social Anxiety Scale, LSAS）** 的双轴评估模型。量表通过两个相互独立又协同作用的维度，对受试者的社交心理状态进行多层次解析：

* **结构维度（设计框架）：**
* **情境类型（Subscale）**：区分场景的心理压力源，分为绩效操作（`ps`）与社交互动（`si`）。
* **反应维度（Dimensions）**：区分内隐心理体感（`fear`）与外显行为决策（`avoidance`）。


* **测量目的：**
* 降低受试者的**社会赞许性偏见**与**防御心理**（通过隐去专业词汇，采用场景化行为描述）。
* 实现内心痛苦（情绪）**与**功能受损（行为）的解耦诊断。



---

## 二、 双轴四区评估原理（Fear & Avoidance）

### 1. 维度定义

| 维度 | 定义 | 测量核心 | 表现特征 |
| --- | --- | --- | --- |
| **Fear（恐惧/焦虑）** | 特定场景下的生理应激与主观心理痛苦度 | **内心消耗与受挫感** | 心跳加速、手抖、大脑空白、担心被评价、局促感 |
| **Avoidance（回避频率）** | 为躲避该场景所采取的实际外显行为 | **社会功能受损程度** | 找借口请假、推脱责任、改发文字不上台、绕道走 |

### 2. 四象限心理画像矩阵

分析系统需根据 **Fear** 与 **Avoidance** 的相对得分，将受试者归入以下四个典型心理图谱：

```
                        高 Avoidance (高行为回避)
                                │
           【高恐惧 - 高回避】   │   【低恐惧 - 高回避】
           重度社交焦虑/全面功能受阻 │   习惯性避开/社交偏好型
                                │
 ───────────────────────────────┼─────────────────────────────── 高 Fear
                                │                       (高内心焦虑)
           【高恐惧 - 低回避】   │   【低恐惧 - 低回避】
           高功能社交焦虑/硬撑型   │   心理健康/高社交适应型
                                │
                        低 Avoidance (低行为回避)

```

#### 象限特征解析：

* **高 Fear + 高 Avoidance（全面受阻型）**：内心极度痛苦，且社会功能严重中断，需重点进行暴露与认知干预。
* **高 Fear + 低 Avoidance（高功能/硬撑型）**：**职场人群最常见状态**。行为上能完成任务，但内心消耗巨大，极易引发心理代偿性疲劳或隐蔽的躯体化症状。
* **低 Fear + 高 Avoidance（社交偏好/习惯回避型）**：非焦虑驱动，多为性格偏好（内向）或社交精力管理策略，对社会功能破坏性低。
* **低 Fear + 低 Avoidance（高适应型）**：心态平静，行为顺畅。

---

## 三、 子量表分类原理（`ps` vs `si`）

量表将 24 个基础场景（拆分为 48 题）严格划分为两类子场景，分析体系须针对子量表得分比重进行针对性诊断：

```
                   ┌── ps (Performance) 绩效与操作表现 ─── 害怕出丑/手抖/失误
24 个 LSAS 基础场景 ┤
                   └── si (Social Interaction) 社交互动 ─── 害怕否定/冲突/冷场

```

### 1. `ps` (Performance / 绩效与操作表现)

* **核心机制**：在他人注视或评估下进行的**单向任务**（如演讲、被盯着工作/写字、公共场所用餐）。
* **焦虑核心**：害怕**失误、笨拙、出丑、手抖**或表现不够完美。
* **得分偏高者特征**：平时私下交流顺畅，但遇到“聚光灯场景”时生理应激强烈。影响主要集中在**公开展示、考评与职场晋升**。

### 2. `si` (Social Interaction - 社交互动)

* **核心机制**：涉及人与人之间的**双向/多向关系建立与沟通**（如与领导交谈、参加聚会、退换商品、表达异议）。
* **焦虑核心**：害怕**否定评价、人际冲突、冷场**或遭到拒绝。
* **得分偏高者特征**：上台汇报尚可接受，但极度害怕无主题闲聊、维护自身权益或处理人际摩擦。影响主要集中在**社交圈拓展、深度关系建立与日常沟通**。

---

## 四、 计分体系与报告分析逻辑

### 1. 基础计分逻辑与权重分配

| 统计指标 | 题目数量 | 分值范围 | 满分上限 |
| --- | --- | --- | --- |
| **全量表总分** | 48 题 | 0 – 144 分 | **144 分** |
| **Fear（恐惧）总分** | 24 题（体验类） | 0 – 72 分 | **72 分** |
| **Avoidance（回避）总分** | 24 题（行为类） | 0 – 72 分 | **72 分** |
| **`ps` 子量表得分** | 26 题 (13 个场景) | 0 – 78 分 | **78 分** |
| **`si` 子量表得分** | 22 题 (11 个场景) | 0 – 66 分 | **66 分** |

### 2. 严重程度分级标准（基于总分）

```
[0分]─────────[30分]─────────[50分]─────────[65分]─────────[80分]─────────[144分]
   无显著社交焦虑     轻度焦虑      中度焦虑      重度焦虑     极重度焦虑

```

* **< 30 分**：无显著社交焦虑（正常社交适应）。
* **30 – 49 分**：轻度社交焦虑（特定场景略感不适）。
* **50 – 64 分**：中度社交焦虑（存在明显的社交困扰与偶发性回避）。
* **65 – 79 分**：重度社交焦虑（社会功能受到显著阻碍）。
* **≥ 80 分**：极重度社交焦虑（全面影响日常工作与生活）。

---

## 五、 给 AI 改写题库与报告生成的 Prompt 研发指令

当指示 AI 修改题库或重新生成分析报告时，请遵循以下约束规范：

### 1. 题库修改指令（Prompt Constraints）

> **【题库重构 Prompt 规则】**
> 1. **去术语化**：禁止出现“焦虑”、“恐惧”、“回避”、“病态”等直白词汇，统一替换为具体生理感受（如“手抖”、“局促”、“心跳加快”）与行为决策（如“找借口绕道”、“改发文字”）。
> 2. **结构对齐**：每个情境必须拆分为“内心体感题”与“行为应对题”，且必须保留正确的 `subscale` 标记（`ps` 或 `si`）。
> 3. **分值映射**：选项必须严格保持 0, 1, 2, 3 的递进阶梯，确保可直接累加至标准 LSAS 总分。
> 
> 

### 2. 报告生成指令（Report Output Logic）

> **【报告生成 Prompt 规则】**
> 生成分析报告时，AI 须包含以下四个维度：
> 1. **综合评价**：给出总分及严重程度分级，评定当前整体心理状态。
> 2. **维度交叉诊断（Fear × Avoidance）**：精准定位受试者属于四象限中的哪一类（如“高功能硬撑型”），并指出其“内心消耗”与“外显行为”的落差。
> 3. **触发场景画像（`ps` vs `si`）**：对比两个子量表得分，说明受试者更害怕“聚光灯下的表现”，还是“双向的人际交往”。
> 4. **定制化建议**：根据象限归属与偏高子量表，提供针对性的认知调整与行为暴露练习（如：针对高功能硬撑型提供降噪与放松建议，针对高 Avoidance 提供微步暴露计划）。
> 
>