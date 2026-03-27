# Color Catch — 糖果跳跳乐 · 产品规格说明书 (PRD)

**版本：** v2.0（重构版）
**日期：** 2026-03-27
**状态：** 草稿 → 待用户确认
**四人协作：** tech agent（技术架构）· product agent（产品体验）· assistant agent（测试验收）· main agent（总策划汇总）

---

## 一、项目背景

### 1.1 背景

Color Catch 是一款 HTML5 Canvas 糖果题材垂直平台跳跃游戏。旧版（v18）因架构问题下线，需从零重构。

**核心玩法：** 玩家控制一颗糖果色小球，通过跳跃搭上颜色匹配的平台得分；颜色不匹配则游戏结束。通过连击（Combo）系统获得分数倍增。

### 1.2 对标产品

参考开心消消乐（乐元素，2014年上线，注册用户 8 亿）的视觉风格和用户留存设计，打造精品糖果题材休闲游戏。

---

## 二、技术架构

### 2.1 技术栈

| 层级 | 技术选型 |
|------|---------|
| 渲染 | HTML5 Canvas 2D |
| 构建工具 | Vite 5（ES Modules） |
| 语言 | Vanilla JavaScript（ES Modules） |
| 音频 | Web Audio API（合成音效，无需外部文件） |
| 样式 | Vanilla CSS + Canvas 绘制 |
| 原生打包 | Capacitor（Android APK） |
| 部署 | GitHub Pages（`/colorcatch/` 子路径） |

### 2.2 项目目录结构

```
colorcatch/
├── index.html              # 入口 HTML
├── package.json            # npm 配置
├── vite.config.js          # Vite 构建配置（含 base: '/colorcatch/'）
├── public/
│   ├── manifest.json       # PWA manifest
│   └── screenshots/        # 游戏截图（菜单/实际风格/玩法）
├── src/
│   ├── main.js             # 应用入口
│   ├── style.css           # UI 遮罩样式
│   ├── game/
│   │   ├── Game.js         # 游戏主控制器 + 游戏循环
│   │   ├── Player.js       # 玩家实体 + 颜色系统
│   │   ├── Platform.js     # 平台实体 + ColorBall 浮球
│   │   ├── Particle.js     # 粒子系统 + 得分弹出
│   │   └── levels.js       # 10 级难度配置
│   ├── render/
│   │   ├── Background.js   # 三层视差背景
│   │   ├── Effect.js      # 屏幕震动控制器
│   │   └── HUD.js          # 分数/连击/关卡显示
│   └── utils/
│       ├── easing.js       # outBack / outBounce / outElastic 弹簧曲线
│       ├── audio.js        # Web Audio 合成器（jump/land/score/combo/bonus/gameover）
│       └── utils.js        # 颜色工具、roundRect、drawStar
└── dist/                   # 构建产物
```

### 2.3 关键技术决策

#### 路径配置（⚠️ 必须修复）
`vite.config.js` 必须设置 `base: '/colorcatch/'`：

```js
import { defineConfig } from 'vite';
export default defineConfig({
  base: '/colorcatch/',   // ✅ 所有资源路径使用子路径前缀
  publicDir: 'public',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
  },
  server: { port: 3000, open: true },
});
```

**未设置后果：** 构建产物使用绝对路径 `/assets/...`，在 GitHub Pages 子路径部署时全部 404，游戏白屏。

#### public/manifest.json 配置（⚠️ 必须修复）
```json
{
  "name": "Color Catch - 糖果跳跳乐",
  "short_name": "ColorCatch",
  "start_url": "/colorcatch/",
  "display": "standalone",
  "background_color": "#87CEEB",
  "theme_color": "#FF6B6B",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/colorcatch/screenshots/screenshot-menu.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

**未修复后果：** PWA "添加到主屏幕" 后 `start_url: "/"` 会跳转到域名根路径，白屏。

### 2.4 GitHub Actions CI/CD

```yaml
# .github/workflows/deploy.yml
- name: Deploy to GitHub Pages
  uses: peaceiris/actions-gh-pages@v4
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    publish_dir: ./dist
    publish_branch: gh-pages
```

**注意：** 构建前必须清理 `~/.gradle/caches/jars-9/`（Android 构建缓存损坏问题，仅影响 Capacitor Android APK 构建，不影响 Web 版）。

---

## 三、视觉与渲染规格

### 3.1 画布规格

| 参数 | 值 |
|------|-----|
| 设计分辨率 | 400 × 640 px |
| 最大宽高 | 400w × 640h（响应式缩放） |
| 缩放策略 | fit viewport，保持 10:16 比例 |

### 3.2 相机系统

- **类型：** 垂直跟随（Vertical Follow）
- **平滑系数：** lerp 0.1
- **玩家纵向位置：** 固定在屏幕 60% 高度处

### 3.3 糖果色配色方案

| 颜色 Key | Hex 值 | 用途 |
|---------|--------|------|
| red | `#FF6B6B` | 红色糖果平台/玩家 |
| yellow | `#FFD93D` | 黄色糖果平台/玩家 |
| blue | `#4ECDC4` | 蓝色糖果平台/玩家 |
| green | `#95E66A` | 绿色糖果平台/玩家 |
| purple | `#C77DFF` | 紫色糖果平台/玩家 |
| orange | `#FF9F43` | 橙色糖果（Bonus 球，50分） |

**强调色：**
- 金色高光：`#FFE66D`
- 阴影色：`#2D3436`
- 背景渐变：天空蓝 `#87CEEB` → 浅粉 `#FFE4E1`
- UI 背景：半透明白 `rgba(255,255,255,0.85)`

### 3.4 玩家角色设计

- **形状：** 径向渐变球体（糖果/宝石风格）
- **眼睛：** 大眼睛 + 高光点 + 腮红 + 小嘴
- **待机动画：** 正弦波上下浮动（±2px）
- **眨眼：** 每 3~5 秒一次（横向线条遮罩）
- **跳跃拉伸：** scaleY 1.3（起跳压扁）
- **落地压缩：** scaleY 0.7（落地回弹）
- **字体：** `Nunito`（圆润无衬线），降级 `sans-serif`

### 3.5 平台类型

| 类型 | 视觉 | 行为 |
|------|------|------|
| `normal` | 纯色糖果渐变 | 静止 |
| `crumbling` | 半透明 + 裂缝线条 | 落地后 0.6 秒崩塌 |
| `moving` | 普通渐变 | 左右振荡移动 |
| `bonus` | 金色渐变 + 星星标记 | 得分 3 倍（橙色球 = 50 分） |

### 3.6 粒子特效

| 事件 | 粒子数 | 行为 |
|------|--------|------|
| jump | 10 | 彩色圆形，向外爆发 + 重力 |
| score | 12 | 金色星星，向上飘散 |
| eliminate | 15 | 大型彩色圆形（颜色不匹配或 Combo ≥ 3） |
| trail | 1/帧 | 快速移动时留下淡色拖尾 |

### 3.7 后处理效果

- **屏幕震动：** Combo ≥ 5 → 震动幅度 4；颜色不匹配 → 震动幅度 6
- **得分弹出：** 金色文字，outBack 缓动放大

### 3.8 三层视差背景

| 层级 | 内容 | 视差速度 |
|------|------|---------|
| 远景 | 渐变天空 + 白云 | 最慢 |
| 中景 | 远山剪影 | 中速 |
| 近景 | 草地/花朵装饰 | 最快 |

---

## 四、游戏逻辑规格

### 4.1 物理参数

| 参数 | 值 |
|------|-----|
| 重力加速度 | 0.38 px/frame² |
| 跳跃速度 | -11 px/frame |
| 水平摩擦系数 | ×0.88/frame |
| 碰撞修正 | 仅顶部碰撞（防止帧跳穿模） |

### 4.2 计分规则

| 事件 | 得分 |
|------|------|
| 普通平台颜色匹配 | 10 分 × Combo 倍率 |
| Bonus 橙色球 | 30 分 × Combo 倍率（直接接触浮球额外 +15 或 +50） |
| 颜色不匹配落地 | 游戏结束 |

### 4.3 Combo 系统

- **触发条件：** 连续颜色匹配，间隔 ≤ 2 秒
- **倍率叠加：** 每次匹配 +1 倍率
- **重置条件：** 2 秒内无新匹配 → 归零
- **Combo × 2+：** 显示 "Nx COMBO!" 弹出文字
- **Combo ≥ 5：** 触发屏幕震动 + 大量粒子爆发

### 4.4 关卡难度系统

- **难度等级：** 10 级，自动递增（每 15 秒升一级）
- **难度提升方式：**
  - 平台间距收窄
  - 崩塌/移动平台比例增加
  - 浮球出现频率增加

### 4.5 音效合成（Web Audio API）

| 事件 | 音效描述 |
|------|---------|
| jump | 上升正弦扫频 |
| land | 柔和撞击声 + 噪声爆破音 |
| score | 升序三音叮咚（C5-E5-G5） |
| combo (2+) | 扩展升序叮咚序列 |
| bonus | 魔法高次谐波闪亮点缀 |
| game over | 降序悲伤音调 + 噪声 |

---

## 五、交互规格

### 5.1 键盘操作

| 按键 | 动作 |
|------|------|
| `←` / `A` | 向左移动 |
| `→` / `D` | 向右移动 |
| `Space` | 跳跃（必须在地面上） |

### 5.2 鼠标/触摸操作

| 操作 | 动作 |
|------|------|
| 水平拖动 | 移动玩家（蓄力/导向） |
| 点击/单击画布 | **跳跃**（必须在地面上）⚠️ 必须实现 |
| 触摸拖动 | 移动玩家 |

**⚠️ 注意：** `canvas.addEventListener('click')` 中 `player.jump()` 调用必须实现，这是 assistant agent 发现的未完成功能。

### 5.3 移动端适配

- 响应式缩放（max 400w × 640h）
- 触摸事件支持
- PWA 支持（manifest.json + Service Worker）

---

## 六、已知 Bug 与修复

### 🔴 P0 — 必须修复

| Bug | 描述 | 修复方案 |
|-----|------|---------|
| **Vite base 缺失** | `vite.config.js` 无 `base` 配置，build 后资源绝对路径导致 404 | 添加 `base: '/colorcatch/'` |
| **manifest.json start_url 错误** | `start_url: "/"` 导致 PWA 安装后白屏 | 改为 `/colorcatch/` |
| **点击跳跃未实现** | `canvas click` 事件注释说"自动跳跃"但没有调用 `player.jump()` | 实现 click 事件处理器 |
| **HUD 字体拼写错误** | `'Nunoto,sans-serif'` 拼写错误，应为 `'Nunito'` | 修正为 `'Nunito'` |

### 🟡 P1 — 应该修复

| 问题 | 描述 |
|------|------|
| **图标路径** | manifest.json 中图标路径需改为 `/colorcatch/screenshots/...` |
| **苹果 PWA meta 标签** | `apple-mobile-web-app-capable` 已弃用（仅控制台警告） |

---

## 七、产品路线图（product agent 输出）

### v1.0（当前阶段）— 修复 + 重构

**目标：** 修复所有 P0 Bug，完成项目重构，让用户能完整玩一局。

| 功能 | 状态 |
|------|------|
| Bug 修复（base 配置、manifest、点击跳跃、字体） | ⬜ 进行中 |
| 项目结构 Vite 重构 | ⬜ 待开发 |
| 音效接入（Web Audio 合成） | ⬜ 待开发 |
| README + 截图文档 | ⬜ 待开发 |
| GitHub Pages 子路径部署验证 | ⬜ 待验证 |

### v1.1（短期，2~4 周）— 建立留存

**目标：** 让用户"今天玩完明天还想来"。

| 功能 | 优先级 | 说明 |
|------|--------|------|
| 最高分记录（localStorage） | P0 | 超越历史最高时触发庆祝特效 |
| 音效支持 | P0 | jump/land/score/combo/bonus/gameover |
| 每日任务系统 | P1 | 每天 3 个任务，凌晨重置 |
| 星星/货币系统 | P1 | 虚拟货币，用于皮肤商店 |
| 成就系统 | P1 | 里程碑成就展示 |
| 全球排行榜 | P1 | Firebase / Google Play Game Services |
| 角色皮肤（3~5 套） | P1 | 换色/换表情/换特效，纯外观 |
| 道具系统 | P2 | 护盾/减速/颜色冻结 |

### v2.0（中期，1~2 月）— 商业化 + 社交

**目标：** 广告变现 + 社交传播链路。

| 功能 | 优先级 | 说明 |
|------|--------|------|
| 激励视频广告 | P0 | 游戏失败后看广告原地复活（每局最多 1 次） |
| 插屏广告 | P1 | 每 3 局最多 1 次，间隔 ≥ 90 秒 |
| 社交分享 | P1 | Canvas 生成分享卡片（分数/日期/角色） |
| 好友邀请系统 | P1 | 邀请码/链接，被邀请者得新手礼包 |
| 关卡模式 | P1 | 每 10 波次为 1 关卡，有步数/得分/收集目标 |
| 章节主题 | P2 | 糖果乐园/冰雪世界/星空夜幕等 |
| 活动系统 | P2 | 每周轮换活动 + 限定皮肤 |
| 体力系统 | P2 | 可选（仅在广告变现遇到瓶颈时引入） |

---

## 八、验收标准

### 8.1 P0 验收（发布前必须全部通过）

- [ ] **`npm run dev` 启动后游戏正常加载**（无控制台 Error）
- [ ] **颜色匹配平台得分**：跳上红色玩家→红色平台，HUD 分数 +10
- [ ] **颜色不匹配游戏结束**：红色玩家跳上蓝色平台，画面切换至游戏结束界面
- [ ] **Combo 系统**：连续匹配间隔 < 2 秒，弹出 "Nx COMBO!" 文字
- [ ] **崩塌平台**：0.6 秒后消失，可安全踩上去一次
- [ ] **移动平台**：左右自动移动，行为与设计一致
- [ ] **Bonus 橙色球**：接触后得分 50，且金色粒子特效触发
- [ ] **点击跳跃**：单击画布触发跳跃（键盘 Space 同效）
- [ ] **键盘操作**：← / A 左移，→ / D 右移，Space 跳跃
- [ ] **触摸操作**：水平拖动移动玩家
- [ ] **屏幕震动**：Combo ≥ 5 触发屏幕震动
- [ ] **粒子特效**：jump/score/eliminate/trail 四种粒子正常触发
- [ ] **视差背景**：三层背景以不同速度滚动
- [ ] **Q弹动画**：玩家跳跃/落地使用 outBack / outBounce 曲线
- [ ] **游戏结束界面**：显示最终分数 + 重新开始按钮
- [ ] **`npm run build` 构建产物存在**：`dist/index.html` + `dist/assets/` 生成成功

### 8.2 技术验收

- [ ] **`vite.config.js` 包含 `base: '/colorcatch/'`**
- [ ] **`dist/index.html` 中资源路径以 `./assets/...` 开头**（不是 `/assets/...`）
- [ ] **`public/manifest.json` 中 `start_url` 为 `/colorcatch/`**
- [ ] **GitHub Pages 部署后无 404 错误**：打开 https://chinazll.github.io/colorcatch/ 游戏正常显示
- [ ] **PWA manifest 加载成功**：控制台无 manifest 相关 Error
- [ ] **字体拼写修正**：`'Nunito'`（不是 `'Nunoto'`）

### 8.3 音效验收（v1.0 完成后的补充验收）

- [ ] **跳跃音效**：每次 Space/点击跳跃，播放上升扫频音
- [ ] **落地音效**：每次落地播放柔和撞击声
- [ ] **得分音效**：颜色匹配时播放升序叮咚
- [ ] **Combo ≥ 2 音效**：播放扩展升序叮咚序列
- [ ] **Bonus 音效**：接触橙色球播放魔法高次谐波音
- [ ] **游戏结束音效**：播放降序悲伤音调

---

## 九、开发阶段规划

### 第一阶段：Bug 修复 + 重构（MVP）

**目标：** 产出可玩的重构版本，无 P0 Bug。

| 步骤 | 内容 | 负责方 |
|------|------|--------|
| 1.1 | 修复 `vite.config.js`：`base: '/colorcatch/'` | tech |
| 1.2 | 修复 `public/manifest.json`：`start_url` + 图标路径 | tech |
| 1.3 | 修复 HUD 字体拼写：`Nunoto` → `Nunito` | tech |
| 1.4 | 实现点击跳跃：`canvas click` 调用 `player.jump()` | tech |
| 1.5 | 创建 `src/` 目录结构（Game.js / Player.js / Platform.js 等） | tech |
| 1.6 | 实现 Web Audio 合成音效 | tech |
| 1.7 | 重写 README + 截图 | tech |
| 1.8 | 全部验收测试（本地 + GitHub Pages） | assistant |
| 1.9 | 确认后 git push + 合并 PR | main（用户确认） |

### 第二阶段：留存功能（v1.1）

**目标：** 让用户每天回来。

| 步骤 | 内容 | 负责方 |
|------|------|--------|
| 2.1 | localStorage 最高分记录 | tech |
| 2.2 | 每日任务系统（3 个任务/天） | tech + product |
| 2.3 | 星星/货币系统 | tech + product |
| 2.4 | 成就系统（里程碑 UI） | tech + product |
| 2.5 | 全球排行榜（Firebase） | tech |
| 2.6 | 3 套角色皮肤（草莓小糖/蓝莓精灵/柠檬小子） | product + art |
| 2.7 | 道具系统（护盾/减速/颜色冻结） | tech + product |
| 2.8 | 完整测试验收 | assistant |

### 第三阶段：商业化（v2.0）

**目标：** 广告变现 + 社交传播。

| 步骤 | 内容 | 负责方 |
|------|------|--------|
| 3.1 | 激励视频广告接入（AdMob / AppLovin MAX） | tech |
| 3.2 | 插屏广告接入（严格频率控制） | tech |
| 3.3 | 社交分享截图生成（Canvas） | tech |
| 3.4 | 好友邀请系统 | tech + product |
| 3.5 | 关卡模式重构 | tech + product |
| 3.6 | 章节主题 × 2（冰雪世界/星空夜幕） | product + art |
| 3.7 | 活动系统 + 限定皮肤 | product |
| 3.8 | 完整测试 + 变现 KPI 验证 | assistant |

---

## 十、关键产品指标（KPI）

### v1.1 里程碑指标

| 指标 | 目标值 | 说明 |
|------|-------|------|
| 次日留存 | ≥ 35% | 新用户第二天回来的比例 |
| 第 7 日留存 | ≥ 15% | 核心玩家留存 |
| 人均游戏局数/天 | ≥ 3 局 | 每日任务驱动 |
| 分享率 | ≥ 5% | 玩过游戏且有分享行为的用户比例 |

### v2.0 里程碑指标

| 指标 | 目标值 | 说明 |
|------|-------|------|
| 广告 ARPU | ≥ $0.05/DAU | 每天每个活跃用户贡献 |
| 激励视频观看率 | 5%~10% | DAU 中看过激励视频的用户占比 |
| 付费率 | ≥ 1% | 付费用户 / 总用户 |
| LTV（用户生命周期价值） | ≥ ¥3 | 每个用户平均贡献 |

---

*PRD 完*
*综合汇总自：tech agent（技术架构 + Web 问题诊断）· product agent（体验优化 PRD + 产品路线图）· assistant agent（测试报告 + 完整验证报告）*
