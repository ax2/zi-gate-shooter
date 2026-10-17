# Stage-216 验证与边界

28项不同相关检查通过：核心16（含108排程、独立电路、固定耐久、旧闸甲/激光/EMP、9条R2/3/4整章路线及18条晚段镜像路线），正常成长4（3路线默认/断供各300秒＋弹道强拆300秒），R3百种子5批，R6/9/12双种子三起点18整章路线3项。100种子最终checks-fairness-release通过；不重复累计中间复跑。未运行全仓库测试。

初版R3无击杀在58秒无路；独立晚段R9/9001/x68也失败，52秒之后不包含新增21秒组，暴露原53.5增援与55.5炮阵重叠。调整中段方向、重装第三攻势提前47秒后，所有上述原反应路线通过；未降低450ms新入场反应、HP3、无击杀、子弹/实体上限和首领入场要求。保留checks-safety、checks-core及debug.json失败证据，不编造更早版本的人评。

正常World从R1开始，真实移动、赚点和选分支，12条旧新300秒流程：旧3条安全路线＋新3路线×默认/优先中继/优先炮；9条新流程均300秒HP3、拾取11–12、领取13–14门，最长成长空档仍20.65秒。比较原21/22.8两炮，旧均0实弹；新默认双炮分别6/9发。优先中继三路线在0.67–0.72秒击毁中继，双炮出招显著减少并最终都被击毁；优先炮的弹道构筑可在中继存活时击毁双炮，另外两路线仍较慢。辅助操作者能看预测危险，不能把HP3视为真人难度验收。

类型检查与Vite构建通过，CkdSFMVC，364.24KB/gzip110.40KB。固定5178 PID38784，主页/脚本/中继PNG直连HTTP200，用户页未操作。冻结46资源SHA一致，5299未启动，无ZIP。

浏览器插件不可用，沿用CUA独立测试页。手机390×844/Canvas390×754、桌面1280×800/Canvas1280×710，正常菜单→五武器成长→两首领→R3闭甲/双炮各3发/开甲。93/94最终两端0警告/错误，虚拟60Hz、独立内存保存，不注入World，不是性能或真人测试。手机第一轮齐射后选拆中继，26.6秒源HP0、双炮停火；桌面集中炮台取得前炮击毁，但连锁也先击毁中继，因此不能用该桌面截图声称“中继完好直接拆炮”，该独立打法仅由正常World弹道专项证明。两端34秒均HP3/五武器/9门且playing。弱档World严格相同。

早期测试页未保留死目标引用，错过死亡暂停；继续长跑还暴露未处理复合弹芯的Rejected branch:ricochet。均为测试页问题，修为只读引用缓存、分支资格和after-breach终止，最终在34秒内复测上述观察缓存；超出该窗口的测试页长跑未再渲染验证。原始终端问题说明保留fixture-early-error.txt，不能将早期错误隐去后声称所有运行均零错误。

遗留：电磁/光学正面拆炮慢，真人是否能理解中继/开甲、重装整章是否足够刺激、超长循环变化、低端性能和20.65秒奖励空档仍未验收。本阶段是具体战术进展，不是完整目标完成；平台工作继续后置。

复现本阶段：在尚无对应基线文件的检出中先运行node tools/capture-stage216-baseline.mjs；chapter-assaults历史排程对照另需node tools/capture-stage215-baseline.mjs。捕获脚本拒绝覆盖既有证据。运行npx vitest run tests/breach-group.test.mjs tests/control-shutter.test.ts tests/swarm-routes.test.ts tests/fire-control-routes.test.ts tests/chapter-assaults.test.mjs tests/breach-progression.test.mjs tests/breach-routes.test.ts；百种子单独运行npx vitest run tests/fairness.test.ts -t 'round 3 batch'。正常旧新流程为node tools/run-breach-audit.mjs，生产构建为npm run build。
