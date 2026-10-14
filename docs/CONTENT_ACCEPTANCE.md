# 当前内容验收清单

截至Stage-93；目标仍为内容、画面、体验，排除平台发布。

| 要求 | 当前权威证据 | 判定 |
| --- | --- | --- |
| 五种实际不同武器与三阶外观 | core/weapons.ts、world.ts；arc/blast/weapon-choices测试；Stage-87/88原图与运行截图 | 已实现，真人平衡评价未完成 |
| 六敌种战术、轮廓与预警 | core/behavior.ts、CanvasRuntime；sniper/guard测试；Stage-84/86实际图 | 已实现，组合难度主观评价未完成 |
| 三首领独立机体和招牌攻击 | bossAttackForCycle；boss测试；Stage-81至83运行图 | 已实现；整局动态体验证据仍不足 |
| 每章三套战斗组合 | director.timeline/encounterIndex；encounters、fairness、progression测试 | 规则存在与路线约束有证据；重复度尚待真人反馈 |
| 升级、命中、死亡与持续强化表现 | CanvasRuntime/combat-light/weapon-motion；Stage-87至92运行图 | 单帧与生命周期通过；不等于审美最终验收 |
| 正常拾取、门结算、上限、循环、暂停 | rules/reward-window/weapon-choices/progression/native-flow等 | 有针对性测试，近期最终整合本阶段执行 |
| 新版持续真实渲染与声音 | Stage-93 interrupted-run.json | 仅162.7秒，失焦安全暂停；20分钟未完成 |
| 真人爽感、可读性、重复度 | 用户早期认可旧方向；新版反馈问题已发送 | 缺少针对完整新版反馈，不得记作通过 |

下一步应围绕真实体验证据与反馈收敛，不能继续用小幅光效数量或报告数量代替完成。后台中断不构成需要修改游戏规则的证据。
