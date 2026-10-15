# Stage-127 验证报告

## 对照范围
固定600秒规则模拟，seed1337，optical/electric/ballistic三种技能偏好。装备/门奖励正常结算、真实技能点；全知操作者只提供横向目标，不增强角色、不删除危险。`tests/combat-pressure.test.mjs`每次保存独立时间戳记录，并检查前三章实际出弹且每次首领战短于20秒；这项检查在旧基线不满足。

|偏好|原十分钟敌弹|新敌弹|原首领存活秒|新首领存活秒|新受伤|
|---|---:|---:|---|---|---:|
|光学|29|176|0.767–2.650|4.450–10.033|0|
|雷电|29|173|0.783–2.650|4.450–9.633|0|
|弹道|23|156|0.617–2.650|4.250–7.650|0|

基线：build/qa/runs/2026-10-15T00-32-26-286Z-combat-pressure-baseline/pressure.json。
最终规则记录：build/qa/runs/2026-10-15T00-37-17-771Z-combat-pressure-current/pressure.json。
Stage目录中pressure-before/after.json、comparison.json保存副本。不是全时段或所有构筑的平衡证明。

## 实际命令与结果
- 初次压力/首领/契约16项通过；初次候选数值测量输出。
- npm test：微信候选生成后Vitest，51文件311项中306通过、5项旧假设失败，耗时163.22秒。该脚本为现有共享测试入口，未启动微信发布/接入。
- 修订断言后`npx vitest run tests/armor-motion.test.ts tests/elite-motion.test.ts tests/sniper.test.ts tests/explosion-render.test.ts`：79通过。
- `npx vitest run tests/difficulty.test.ts tests/combat-pressure.test.mjs`：3通过。
- 最终HUD修订后`npx vitest run tests/explosion-render.test.ts tests/difficulty.test.ts`：71通过。
- npm run build：类型检查与Vite成功，最终脚本canvas-preview-C5DR4-tE.js。
- 固定包43个dist文件SHA256匹配；package-manifest.json为逐文件清单。未复跑最终单次完整套件，不能报告“最终完整314项一次全绿”。

## 渲染与交互QA
流程：开发夹具选择首领压力及第三章→真实运行3.7秒→冻结画面；固定包主界面→开始突围→暂停。
环境：Codex IAB/CUA，390×844及1280×720，开发5178及静态5203。独立Browser skill未列出，使用本会话已有CUA浏览器接口；没有另启外部Playwright。

|检查|证据与结论|
|---|---|
|页面身份|fixture URL和标题、静态5203标题火力突围，匹配|
|非空白|Canvas截图显示机体、HUD、实际子弹；Canvas无DOM文字以像素为准|
|框架覆盖错误|截图未见Vite错误覆盖层|
|控制台|检查warn/error列表为空|
|手机/桌面|首领名称和3915/5760血量清晰，实际红色敌弹与友方彩色火力可区分；未绘未来射击轨迹|
|真实点击|夹具选择/运行成功，静态开始后playing画面、点暂停后暂停菜单|

截图boss-mobile.png、boss-desktop.png为修订HUD后的第三章预置夹具：五个T3拾取+火力50%，非自然流程。render-mobile.json记录实际3.7167秒、48枚子弹和模式；不扩大为长局性能。首次并行测试导致暂停的boss-mobile-interrupted.png保留，未修改暂停保护规避它。

## 剩余风险
低装备首领耗时、非预知操作者反应、所有种子/精调路线、低档画面、连续20分钟渲染和听感未在本阶段验收。新增血量曲线是候选；不能将敌弹数量增加或自动驾驶无伤视作“好玩”已验证。
