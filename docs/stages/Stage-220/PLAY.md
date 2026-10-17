# Stage-220 试玩

入口：http://127.0.0.1:5178/ 。回菜单刷新后开新局，已有局不热替换。服务停止可双击项目“启动游戏.cmd”。

第二轮首领：外侧哨机锁定入场位置，抢拆一翼或看实弹换位；持续站中路会受到惩罚。第三轮首领：先拆前方供能卫队解除45%减伤，再集中输出；击破护卫实际获得15充能。第一轮单首领保持。

注意比较升级后快速抢拆、优先首领和优先护卫的差别。后期耐久倍率逐步回落，不维持被否决的四倍长血条。所有参数待试玩。

完整可玩目录build/playable/Stage-220；阶段备份服务为5303，未启动。正式验收不包括微信/Android/低端性能。

复核命令：node tools/capture-stage220-baseline.mjs（需含56671fc的Git历史，已有快照时拒绝覆盖）；node tools/run-boss-team-audit.mjs；设置BOSS_TEAM_SECONDS=1200后再运行，生成独立长局文件；node tools/check-boss-team-audit.mjs。原生观测页tools/visual-fixtures/boss-team.html为正常菜单/已赚成长，虚拟60Hz输入，无World注入，非真人或性能基准。
