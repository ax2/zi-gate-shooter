# Stage-235 试玩

固定入口：http://127.0.0.1:5178/ 。刷新重新出击。首章保持，后续三章约21秒中段随战况轮换；同一章节再次出现时，留意固定哨、机动哨、横移炮与折返弹的差异。仍是横移自动射击，箱碎后拾取、门穿过结算、武器叠加。

最终canvas-preview-CqXNDweU.js；完整冻结build/playable/Stage-235，46资源SHA256与dist相同。备用5318未启动；需要时该目录运行node serve.mjs，无ZIP。原固定5178主页和脚本已直连200。

复现：旧基线缺失时node tools/capture-stage235-baseline.mjs，固定306a4a6且已存在拒绝覆盖。npx vitest run tests/middle-rotation.test.ts tests/assault-rotation.test.ts tests/early-reinforcements.test.ts tests/chapter-assaults.test.mjs。node tools/run-middle-rotation-audit.mjs默认战况0的6对300秒；PowerShell设置ROTATION_PLAN=1/2另跑两战况，设置ROTATION_SECONDS=1200跑三安全构筑长流；ROTATION_MODE=routes跑90条独立延迟观察路线。node tools/check-middle-rotation-audit.mjs汇总核对。各环境变量应在独立shell或运行后清除，勿混用mode。

实景夹具tools/visual-fixtures/middle-rotation.html从正常菜单升级到六个中段，无World注入，虚拟60Hz/隔离存档，仅作功能与像素验证。不会加快用户原试玩页或修改用户存档。图像与未测试边界见TEST_REPORT。

历史回归另依赖Stage228/231/233基线；缺失时按对应capture脚本获取（存在均拒绝覆盖），不改历史Git源码或用当前代码冒充旧版本。
