# Stage-233 试玩

固定入口：http://127.0.0.1:5178/ 。刷新后重新出击，第二章起体验新增追兵；首章保持。

每章开头2.6/4.8秒两批追兵，共6个排程目标，实际接纳受安全检查影响。走廊是交替机群＋折返冲锋，侧翼是两次短刺＋固定屏风，重装是锚炮后接横移炮。仍可提前击破炮机，保留原门箱与武器成长。

最终canvas-preview-CHaA4AVy.js，完整冻结build/playable/Stage-233，46资源与dist哈希匹配，备用5316未启动，无ZIP。实景、统计和未测试边界见TEST_REPORT.md；整体内容、趣味和真人难度继续。

相关复现需对应历史Git提交和本地基线模块。缺失时分别运行tools/capture-stage225-baseline.mjs、capture-stage228-baseline.mjs、capture-stage231-baseline.mjs、capture-stage233-baseline.mjs；已有基线拒绝覆盖，不要重复创建。随后运行tests/early-reinforcements.test.ts、assault-rotation.test.ts、chapter-assaults.test.mjs、opening-assaults.test.ts。正常审计用tools/run-early-reinforcements-audit.mjs和run-chapter-gaps-audit.mjs，核对用check-early-reinforcements-audit.mjs/check-early-reserve-visual.mjs。
