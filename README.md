# 🪐 单词星球大冒险 · Word Pop

给初中生的桌面网页单词游戏：**点爆单词怪，多轮记忆 2100 个初中/中考核心单词**。

**在线游玩：** https://gooddays9999.github.io/word-pop/

## 玩法与记忆设计

- **星球地图闯关**：单词按主题分成 10 大星域、每 20 词一关，顺序解锁；学会的单词变成图鉴卡收藏
- **每日循环**：先打「复习副本」（按记忆曲线到期的词），再学新词（默认 20 个/天，设置可调 10/20/30/50）
- **多轮记忆内核**（Leitner 盒子间隔重复）：
  - 盒子间隔：当日 → 1 天 → 2 天 → 4 天 → 7 天 → 15 天 → 30 天 → 毕业
  - 新词需两连对晋级；答错降 2 个盒子并当日重考
  - **题型随熟练度升级**：看英选中 → 看中选英 → 听音辨词 → 拼写输出
- **进度安全**：本机 localStorage + 每日自动备份轮换；设置页可导出/导入 JSON 备份

路线图：M2 听音/拼写题型与音效 → M3 全量 2100 词 + Boss 战 → M4 单词塔防 → M5 打字飞机射击（ZType 式拼写空战）→ M6 图鉴/统计/离线 PWA。

## 开发

```bash
npm install
npm run dev            # 本地开发 http://localhost:5173/word-pop/
npm test               # 单元测试（engine/storage 覆盖率闸门 85%）
npm run e2e            # 构建 + Playwright 端到端测试
npm run words:validate # 词库校验（结构/唯一性/词性白名单/统计报表）
npm run words:build    # 编译词库 → src/data/*.compiled.json
```

调试参数：`?day=2026-07-11` 时间旅行（测试跨天复习）、`?fast=1` 缩短答题反馈停留。

### 架构速览

```
data/words/batch-NNN.json   词库源（每批 ~100 词）→ scripts/ 校验+编译
src/engine/                 纯函数核心（零 React 依赖）：srs 盒子转移 / question 出题
                            / session 会话构建·运行·结算 / economy 经验与连击
src/storage/                zod 版本化存档 + 每日备份 + 导出导入
src/store/                  zustand 屏幕状态机 + 防抖持久化
src/games/quiz/             Quiz 战斗皮肤（塔防/空战后续里程碑接入同一会话状态机）
src/screens/                标题 / 基地 / 地图 / 战斗 / 结算 / 设置 / 存档恢复
```

技术栈：React 18 + TypeScript(strict) + Vite + Zustand + Tailwind v4 + Zod + Vitest + Playwright。发音用 Web Speech API，美术全部 emoji + CSS，零二进制资产。
