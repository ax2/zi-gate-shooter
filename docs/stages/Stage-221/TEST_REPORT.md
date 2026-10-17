# Stage-221 验证记录

2026-10-17。对照基线52bdb4fb2764a6dacbc07cb1d8f9909d9a6b3666。生产包canvas-preview-BpeWN_32.js。

## 自动检查

四文件29项通过：overload-tempo、support-weapons、kill-rewards、context-guide；npm run build包含类型检查通过。新增6项验证实际弹道与激光加速、冷却进度/退出恢复、刷新不叠乘、首领入场无蓄积齐射和满配弹体预算。满配是隔离单元夹具，不当作正常获得证明。未执行全仓测试。

首次测试误把含起手齐射的一秒次数按间隔数计算，正常9/超载11次含起手，对应8/10间隔；激光4秒窗口可能各2次，改为5秒窗口并核验间隔。这是测量修订，没有为断言修改生产数值。

## 正常成长对照

600秒三构筑×首领优先/护卫优先/首领期间站中×旧新，共18流；1200秒三构筑首领优先×旧新，共6流。共24流，使用同一1337种子，长流是相同策略延伸，不是24独立随机种子。通过真实控制/门/拾取/研发获得成长，未注入免伤或构筑。安全策略使用预知信息与零反应延迟，不代表真人难度。

六个当前安全600秒流HP3。当前1200秒弹道/电磁/光学HP3，各14/12/12次首领胜利，最长首领10.02/20.37/34.50秒，真实充能/刷新47/43/41次，峰值总弹体均67；固定预算未溢出，首领初始HP按同轮与旧版一致。站中策略电磁本轮约436.98秒死亡，光学约345秒死亡，弹道仍存活；分支、瞄准和时间会分化，不据此宣称全面加难或全部构筑单调更快。firing统计按步前状态分类，精确单枪频率另由测试验证。

运行tools/capture-stage221-baseline.mjs固定基线；tools/run-overload-tempo-audit.mjs（BOSS_TEAM_SECONDS=600或1200）与tools/check-overload-tempo-audit.mjs复现。统计JSON和验证器输出附于本目录。

## 实际Canvas检查

tools/visual-fixtures/overload-tempo.html使用真实开始/输入/正常成长、虚拟60Hz，隔离存档，声音与震屏关闭。?gate=energy为正常选择充能门；?version=baseline&gate=energy对照旧版。仅读取效果流，不修改World。

旧新均63.6333秒自然触发充能超载，64.45秒截图；之后0.8167秒窗口新版25次、旧版21次齐射事件，非子弹个数，此时未解锁激光。默认路线首次94.2667秒由实际拾取触发，另存default-hot.png。所有正常profile在结束70.4667秒保持一致，rate恢复1，永久火力+70%、HP3保持。

mobile-hot/mobile-loadout/mobile-weak/mobile-off为390×844视口、390×754画布；desktop-hot/desktop-old-hot/desktop-off为1280×800视口、1280×710画布。实际排热结构/短喷流、计时数值可读；暂停参数五枪常态8/5/5/3/2.5与临时1.25分开。暂停和弱档切换sameWorld=true；两端控制台日志均空。未单独强制边缘截图。

browser-state-summary.json保留关键状态与原始快照SHA256；完整原始快照留本地build/qa/Stage-221（含history/physical，未纳入Git）。截图为真实Canvas，并非概念图。mobile-hot已再次人工查看。

## 交付及边界

固定5178主页、最终脚本及guard-v1.png均HTTP200。冻结46资源SHA一致，附delivery-http.json/frozen-resources.json；备用5304未启动。自用浏览器105/106已清尺寸并关闭，自用5255已停止，用户原标签未操作。

未执行真实设备性能测试、音频试听、真人长局平衡/趣味验收、全仓测试或全新环境安装。自动安全策略无伤说明可完成，不证明难度合适。整体敌量/章节战术/长期选择还需继续，平台工作后置。
