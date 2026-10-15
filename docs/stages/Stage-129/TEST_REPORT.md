# Stage-129 验证报告

## 已实现
契约完成后选择充能、已有配件升阶或T3单武器专属精校；一份奖励只领取一次，保留全部既有能力。快捷入口置于战斗HUD下方空位，实体靠近时隐藏；旧暂停入口保留。强化说明读取所选武器。

## 测试与构建
- npx vitest run tests/contracts.test.ts tests/contracts-combat.test.mjs tests/explosion-render.test.ts：最终81通过，覆盖领取互斥、无效武器、待领不能被覆盖、层级保留、精校倍率、数量预算、死亡边界、奖励暂停/恢复、充能转技能选择、强化副武器引导。
- npx vitest run tests/contracts-progression.test.mjs：1通过，charge/equipment两策略各600秒，正常T1出发、真实领取/升级/技能点；各领取6次。前者mastery29，后者mastery23/爆裂精校4；均HP3/第8轮。全知驾驶器输入、seed1337，不证明难度/乐趣。
- npm run build：类型检查和Vite通过，最终canvas-preview-CZ7Y2C9h.js。
- 固定包44文件与dist SHA256逐一匹配，package-manifest.json。未执行最终完整套件/Android/微信运行。

## 渲染与交互
环境：Codex IAB/CUA，开发5181、固定5205；390×844/1280×720。沿用前端测试技能，未使用外部Playwright。

|检查|结果|
|---|---|
|身份/空白/覆盖层|URL和标题匹配；实际Canvas内容正常，无框架错误覆盖|
|奖励六选项|手机/桌面标题、充能增量和五种精校卡完整，reward-mobile/desktop.png|
|实际领取|桌面点击速射精校，pulse1其他0，pendingfalse、modeplaying，claim-state.json|
|契约接取|固定包暂停→当前参数→契约→接取，显示进行中/继续挑战，accepted-mobile.png|
|快捷入口|正常开局中渲染可见，entry-mobile.png；规则/点击状态转换单元测试通过，但实际自动连续点击被长帧暂停中断，保留未验|
|控制台|warn/error列表为空|
|连续运行|未通过：前台也出现约1秒帧间隔，自动保护暂停。interrupted-static.json：time0.5167、75回调、p95约1000.1ms；根因未确定|

奖励布局夹具预设elapsed29.99/kills15并放4个T3掉落，下一步生产逻辑完成契约；不是自然实玩30秒成功。双策略纯规则模拟补充实际长期领取证据，不替代渲染长局。

## 工作区恢复
首次写World时E盘空间不足，git diff与blob比对确认原文件仍为d64587d。D:\work是E卷挂载别名。当前副本位于本任务C盘目录，保留完整Git历史及项目自己的依赖，origin仍为ax2/zi-gate-shooter；原项目及历史构建未删除。C副本之后的代码是当前版本，E副本停留Stage128。workspace-recovery.json与当前README记录路径，避免混用。

## 待验
当前IAB连续运行/快捷入口实际点击、低端性能、额外数值长期曲线、非预知输入与真人体验。专属精校+50个百分点为候选。不能把本阶段称完整体验验收或将长帧保护停用来取得通过结果。
