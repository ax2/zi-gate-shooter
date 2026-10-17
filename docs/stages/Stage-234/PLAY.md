# Stage-234 试玩

固定入口：http://127.0.0.1:5178/ 。刷新后重新出击。默认首箱霰射，正常取得电弧配件可看绿色跳电；电磁路线索敌分支呈金色束，光学光链组合呈蓝紫双丝。保留原三章敌阵、武器叠加和奖励。

最终canvas-preview-MqkmZa-Z.js，完整冻结build/playable/Stage-234，46资源SHA256匹配。备用5317未启动；需要时在该目录运行node serve.mjs，无ZIP。

复现：旧基线缺失时node tools/capture-stage234-baseline.mjs（固定e94d696，存在拒绝覆盖）；npx vitest run tests/arc-filaments.test.ts tests/arc.test.ts tests/arc-aim.test.ts tests/electric-branches.test.ts tests/laser-chain.test.ts。node tools/run-arc-filaments-audit.mjs默认四条300秒；PowerShell设$env:SIGNAL_SECONDS='600'后运行同命令为平衡600秒；node tools/check-arc-filaments-audit.mjs核对。

实景夹具tools/visual-fixtures/arc-filaments.html与?version=old均从菜单正常成长，逐次推进到三种真实放电，最后可推进3帧或切弱档。虚拟时钟/隔离内存存档，未注入World；截图JSON的arcStates保留真实链接，arcs仅诊断计数。node tools/check-arc-filaments-visual.mjs核对完整状态，PNG可读性需另看。
