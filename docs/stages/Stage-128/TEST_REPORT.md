# Stage-128 验证报告

新增六格原创机械挂载、独立回弹和本局机甲查看入口；未改World规则/伤害/射击原点。当前固定候选http://127.0.0.1:5204/。

## 命令与结果
- node tools/export-mounted-modules.mjs：1536×1024 RGBA源图→768×512透明成品，415736字节，6格可见像素非空、格边越界0；明细asset-export.json。
- npx vitest run tests/explosion-render.test.ts tests/weapon-motion.test.ts：最终74通过。
- npx vitest run tests/native-flow.test.ts tests/browser-image.test.ts tests/asset-load.test.ts：9通过。
- npm run build：最终类型检查与Vite通过，脚本canvas-preview-DNt9l5po.js。没有重跑本阶段单次完整套件。
- package-manifest.json：44文件与dist逐一SHA256一致。

## 渲染QA
流程：机甲夹具真实拾取/发射→暂停→当前火力→查看机甲→返回；固定包正常T1开局重复入口检查。
环境：Codex IAB/CUA，开发5178、固定5204；390×844和1280×720。沿用已加载前端测试技能与CUA接口，无外部Playwright。

|检查|结果|
|---|---|
|身份|URL与标题匹配夹具/火力突围静态入口|
|非空白/覆盖层|Canvas实际显示机体、配件、等级，未见框架错误覆盖|
|控制台|dev.logs warn/error列表为空，固定包流程后复查仍空|
|实际战斗形态|手机多炮、长轨、棱镜轮廓出现；没有新增未来敌弹轨迹；battle-mobile.png|
|放大排版|手机/桌面五武器与两种组合文案完整，机体不裁边；rig-mobile/desktop.png|
|交互/冻结|实际点击进入rig后返回loadout，time保持0.3166667；inspection-state.json|
|正常开局|静态包从T1进入查看，只显示已有单炮；static-rig-mobile.png|

夹具预置9节点并在玩家处放置四个T3掉落物，生产规则拾取后显示五武器（速射T1其余T3）；没有敌机，不构成敌弹遮挡验收。初次检查的悬浮感通过金属支架修订后重新截图，最终截图含支架。放大图是游戏内真实渲染，非概念图替代。

## 风险
更多drawImage、支架绘制与新增纹理尚未做低端性能/20分钟渲染验收。弱特效档使用同一机械素材，未独立实机截图。全五类模块逐种开火动态审美、自然收集过程与危险识别仍待测。AI生成素材标记为候选，不称最终美术签收。
