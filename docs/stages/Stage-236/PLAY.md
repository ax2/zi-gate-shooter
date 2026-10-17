# Stage-236 试玩

固定入口：http://127.0.0.1:5178/ 。刷新重新出击。驾驶舱擦边通过门也可领取；炮管伸进去但驾驶舱没到仍不算，远离门依然会错过。双门仍只领较近的一门，仍需持续射击把奖励打高再穿过。

最终canvas-preview-BREiJZTv.js；完整冻结build/playable/Stage-236，46资源SHA256与dist匹配。备用5319未启动；需要时在该目录node serve.mjs，无ZIP。5178当前主页与脚本直连200。

旧基线缺失时node tools/capture-stage236-baseline.mjs，固定6c5001c且已存在拒绝覆盖。相关检查：npx vitest run tests/gate-contact.test.ts tests/kill-rewards.test.ts tests/gate-feedback.test.ts tests/gate-receipt-runtime.test.ts；另选reward-window.test.ts的dedicated charge/crossing a charged/paired gates/intervening五项，不把两项未选测试称通过。

node tools/run-gate-contact-audit.mjs为默认6对300秒；在独立PowerShell中GATE_PLAN=1/2分别测另两战况，GATE_SECONDS=1200测三安全构筑长流，GATE_MODE=routes测90条延迟路线。不同mode/plan请独立shell或清环境变量，避免误用。node tools/check-gate-contact-audit.mjs核对。

根因证据gate-opportunities-before.json在改动前生成；tools/run-gate-opportunities-audit.mjs现在从Stage235/236两个冻结基线复现Stage234→235旧问题，写gate-opportunities-recheck.json，避免当前新规则污染历史。Stage235旧基线依赖其capture脚本，存在均拒绝覆盖。

实景夹具tools/visual-fixtures/gate-contact.html及?version=old从菜单正常成长，step观察器只记录首次真实擦边与前一渲染帧，不注入World。先同手机视口，再开始/推进；继续3帧可检查不重复发奖并观察回执。切弱档或改视口应在成对接触取证完成后，避免中途重置触摸。node tools/check-gate-contact-visual.mjs核对状态，像素需另看。
