# Stage-237 试玩

固定入口：http://127.0.0.1:5178/ 。刷新重新出击，首章38秒左侧可见脉冲火箭炮。先蓄能、左右各发一枚；火箭先缓行，0.75秒后在原方向加速。可先拆炮，也可看已发实弹换位；炮机撤离或被毁后火箭仍在，未显示未来轨迹。后续走廊按原38/39/55普通炮位出现，强构筑可提前击破。

最终canvas-preview-BTgVXU8D.js。完整本地冻结与备用服务核对见TEST_REPORT最终记录；平台/上架继续后置，无ZIP。

旧基线缺失时node tools/capture-stage237-baseline.mjs，固定a738a30且已存在拒绝覆盖。相关：npx vitest run tests/booster.test.ts tests/booster-render.test.ts tests/bankshot.test.ts tests/gate-contact.test.ts tests/interceptor.test.ts；新增发射/速度/时间分段、EMP、预算、杀炮保留弹、旧扇炮/折返逐帧相同、材质/真实端口喷焰检查。

node tools/run-booster-audit.mjs默认6对300秒；独立PowerShell设置BOOSTER_PLAN=1/2跑另两战况，BOOSTER_SECONDS=1200跑三安全构筑长流，BOOSTER_MODE=routes跑90延迟观察完整章。不要混用环境变量；node tools/check-booster-audit.mjs汇总。初稿重复发射数据另存initial，失败诊断不覆盖。

实景夹具tools/visual-fixtures/booster.html从正常菜单成长，逐次推进炮巢蓄能/缓行双发/同一枚点火/点火后实际位移；不注入World，虚拟60Hz/隔离存档。弱档与桌面应在四个手机采样后再切，避免重置触摸影响流程。截图JSON与实际PNG分开检查。

最终完整冻结build/playable/Stage-237共46资源哈希匹配；备用5320未启动，需要时在该目录node serve.mjs，无ZIP。
