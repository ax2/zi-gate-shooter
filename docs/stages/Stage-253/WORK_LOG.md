# Stage253 压力与反馈核验（进行中）

2026-10-18。上轮属于实际进展：源85d0683已推送，固定入口Stage252、65检查、三章实景及档案0b0f334。当前核验工作树干净，未将局部通过当作完整目标完成。

本轮先查普通操作是否仍缺威胁：正常开局/实际赢取成长，比较原全知安全操作者、首领1后居中站桩、450ms/900ms排队延迟输入。延迟仅延后绝对移动指令，不注入属性、不补装备、不压制敌弹；它不是人类熟练度模拟。对照三构筑各10分钟或真实死亡为止，原始命中原因与首领回血记录保留。

根据数据选择实际内容/体验修订，不预设“敌少”只能堆人，也不为让测试好过削弱敌人。Stage252底部反扑说明被成长提示覆盖仍为明确体验缺口；是否需要独立持续战术状态须结合真实画面决定。当前尚未修改游戏规则或构建。

12组压力诊断已完成，完整表与解释见DESIGN_AND_REVIEW。没有依据全知无伤结果盲目加伤。新增持续状态行解决回援说明被成长回执盖掉的问题，真实World读数、防止虚假击杀含义，标准/弱档10项相关检查和typecheck通过；真实Edge已从正常开局推进中。


## 最终验证与交付

真实Edge正常成长339.9167秒显示回援准备，同时底部激光强化回执；341.1167显示冲锋回援×2；346.9333击破首领并实际领蓝图，HP3、五武器保留。桌面2002×1188、390×844标准/弱档留图，控制台无警告/错误，未显示错误遮罩。

本正常样本在首领先被击破时直接结束回援，没有出现单独反扑结束画面；该状态只在纯规则/渲染检查覆盖，不伪造正常截图。首次控制器误期待固定4个检查点，在实际第三点已领奖时又点击禁用推进而失败；修为以真实boss-reward状态停止，保留原失败。正常同节点341.1167完整序列化World与Stage252控制器严格相等，标准/弱档实际只读World也严格相等。均非逐回调同态或真人/FPS证据。

10相关检查和typecheck/vite build通过，未执行本轮全仓回归，旧254失败未整体解决。完整48运行资源7711530字节逐文件核对dist后冻结build/playable/Stage-253，固定5178真实Edge脚本canvas-preview-DAtc9xfe.js；备用5336未启动，旧冻结保留，无ZIP。

复现命令：npx vitest run tests/boss-tactical-status.test.ts tests/boss-tactical-render.test.ts tests/boss-salvage-render.test.ts tests/contract-receipt.test.ts；node tools/check-boss-tactics-fixture.mjs。压力诊断使用esbuild打包tools/audit-player-pressure.ts为build/qa/Stage-253/player-pressure.mjs，再分别传ballistic/electric/optical运行。浏览器fixture同样打包tools/visual-fixtures/boss-tactics.js至build/qa/Stage-253/boss-tactics.mjs，由Vite服务对应HTML。原始诊断、失败、图片和manifest均保留。

后续仍需章节变化、长局选择价值和真人感受；不把本轮UI改进当作足够内容/酷炫度或整体目标达成。
