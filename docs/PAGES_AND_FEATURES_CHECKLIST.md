# 全站页面与功能检查清单

基于当前代码的检查结果：已发现的问题与未处理/未完成功能汇总。

---

## 一、已发现的问题

### 1. 登录页 (LoginPage)

| 项目 | 说明 |
|------|------|
| **忘记密码** | 「忘记密码？」按钮无 `onClick`，点击无任何行为。后端无找回/重置密码接口，若要做需：前端跳转或弹窗 + 后端 `POST /api/auth/forgot-password` 等。 |

### 2. 新建复盘 / 关联客户弹窗 (NewInteractionPage)

| 项目 | 说明 |
|------|------|
| **硬编码英文** | 弹窗内多处未走多语言：`Link Customer Profile`、`Cancel`、`New Client`、`Create New Client`、`Name`、`Company`、`Confirm & Review`。仅「保存中...」为中文。应使用 `translations[lang]` 或新增 `new.link_modal_*` 等 key。 |
| **优先级文案** | 下一步计划中「高/中/低」、情绪「正面/负面/中性」等在复盘详情由 AI 返回，若 locale 为 en/ja/ko 时后端已按语言返回则无问题；若仍返回中文，需前端按 locale 做映射或后端统一按 locale 返回。 |

### 3. 复盘详情页 (InteractionDetailPage)

| 项目 | 说明 |
|------|------|
| **NotFound 展示** | `if (!item) return <div className="...">NotFound</div>`：仅纯文案，无返回列表按钮或链接，建议加「返回列表」并指向 `/history` 或上一页。 |

### 4. 客户详情页 (CustomerDetailPage)

| 项目 | 说明 |
|------|------|
| **NotFound 展示** | 同上，`if (!customer) return ... NotFound`，建议加返回入口。 |
| **英文 placeholder** | 编辑联系信息时 `placeholder="Role"`、`placeholder="Company"` 未用 `t.*`，与当前语言不一致。 |

### 5. 成长页 (GrowthPage)

| 项目 | 说明 |
|------|------|
| **未接入路由** | `GrowthPage` 未在 `App.tsx` 的 `<Routes>` 中注册，导航中也无入口，页面目前无法访问。若为规划中功能，可后续加路由（如 `/growth`）和导航；若废弃可考虑删除或改为占位。 |
| **假数据** | 页面内 `growthData`、熟练度 Level 8、转化率 +112% 等均为写死数据，未与真实 `interactions` 或后端统计关联。 |

### 6. 历史页 (HistoryPage)

| 项目 | 说明 |
|------|------|
| **无 lang 传入** | 组件签名为 `HistoryPage: React.FC<{ interactions: Interaction[] }>`，未接收 `lang`。若需与系统语言一致（如空状态、搜索 placeholder 等），需在路由传入 `lang={language}` 并在页面使用 `t`。 |
| **搜索 placeholder** | `placeholder="通过姓名、公司或摘要内容搜索..."` 硬编码中文，建议放入 `translations` 并按 `lang` 显示。 |

### 7. 情景演练页 (RolePlayPage)

| 项目 | 说明 |
|------|------|
| **无 lang 传入** | 路由为 `<RolePlayPage customers={...} interactions={...} />`，未传 `lang`。角色扮演与评估的 AI 回复语言无法跟随系统语言，若需与复盘一致，需传 `lang` 并在后端 role-play / evaluate 接口支持 `locale`。 |
| **大量 console.log** | 开发用 `console.log`/`console.error` 较多，上线前建议删除或改为条件打印（如 `if (import.meta.env.DEV)`）。 |

### 8. 其他页面

| 页面 | 说明 |
|------|------|
| **SchedulePage / NewInteractionPage / 等** | 多处使用 `alert()` 做错误或提示，体验较差，可逐步改为 Toast 或页面内提示区。 |
| **ProfilePage** | API Key、模型选择等已有；若后端不支持「前端自定义 API Key」则当前仅为本地/展示用，需与后端能力对齐。 |

---

## 二、未实现或未闭环的功能

| 功能 | 说明 |
|------|------|
| **忘记/重置密码** | 前端仅有按钮，无流程；后端无忘记密码、重置密码、邮件验证等接口。 |
| **成长分析页** | GrowthPage 未挂路由且数据假，真实「销售成长/技能进阶」需定义指标与后端统计接口后再接数据。 |
| **复盘/客户不存在时的统一 404** | 访问 `/interaction/xxx` 或 `/customers/xxx` 当 id 不存在时仅显示 "NotFound"，可统一为 404 页或带返回的空白态。 |
| **多语言全覆盖** | 新建复盘弹窗、客户详情编辑 Role/Company、历史页搜索框等仍有多处英文或硬编码中文，未全部走 `translations[lang]`。 |
| **角色扮演/评估的回复语言** | 复盘分析已按 `locale` 返回对应语言；角色扮演、评估、深度解析等 AI 接口尚未传 `locale`，回复语言可能仍为模型默认。 |
| **错误提示方式统一** | 目前混用 `alert`、页面内 `error` 状态；可统一为 Toast 或全局轻提示，并区分网络错误、配额错误等。 |

---

## 三、建议优先处理顺序（参考）

1. **高**：新建复盘弹窗多语言（使用 `t` + 补充 `translations`），避免中英混杂。  
2. **高**：复盘详情 / 客户详情 NotFound 时增加「返回列表」或返回上一页。  
3. **中**：忘记密码——要么给按钮加 `onClick` 提示「功能开发中」或跳转说明页，要么实现简易找回流程（需后端配合）。  
4. **中**：客户详情编辑处 Role/Company 的 placeholder 使用 `t`。  
5. **中**：历史页传入 `lang` 并将搜索 placeholder 等多语言化。  
6. **低**：RolePlay 传入 `lang` 并在后端支持 `locale`，使演练/评估与系统语言一致。  
7. **低**：GrowthPage 决定是接入路由+真实数据，还是暂时隐藏/移除。  
8. **低**：清理或封装 `console.*`，将关键错误上报或仅开发环境输出。

---

## 四、文件与位置速查

| 问题/功能 | 文件与位置（约） |
|-----------|------------------|
| 忘记密码按钮 | `frontend/pages/LoginPage.tsx` 约 113 行 |
| 新建复盘弹窗英文 | `frontend/pages/NewInteractionPage.tsx` 约 358–379 行 |
| 复盘详情 NotFound | `frontend/pages/InteractionDetailPage.tsx` 约 163 行 |
| 客户详情 NotFound | `frontend/pages/CustomerDetailPage.tsx` 约 69 行 |
| 客户详情 Role/Company placeholder | `frontend/pages/CustomerDetailPage.tsx` 约 142、148 行 |
| 路由与 GrowthPage | `frontend/App.tsx` Routes 段；GrowthPage 未出现在 Routes |
| 历史页 props | `frontend/App.tsx` 中 `<HistoryPage interactions={...} />` |
| 角色扮演页 props | `frontend/App.tsx` 中 `<RolePlayPage customers={...} interactions={...} />` |
| 多语言 key | `frontend/translations.ts`，可为 new、customer_detail、history 等补充 key |

如需我按某一项直接改代码（例如先做「弹窗多语言 + NotFound 返回按钮」），可以指定优先级或文件，我按该顺序改。
