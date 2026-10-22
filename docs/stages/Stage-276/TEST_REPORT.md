# Stage276 验证记录

基线b9e94df，2026-10-22。验证对象是火力装配、图示试装、实际组装回执和局部开火动作；雷电式自由空战仍为默认玩法。

## 规则与交互

`npx vitest run tests/flight.test.ts tests/flight-runtime.test.ts tests/flight-records.test.ts tests/flight-career-runtime.test.ts tests/flight-profile.test.ts tests/flight-rig-runtime.test.ts --reporter=json --outputFile=build/qa/Stage-276/final-tests.json`：78/78通过，其中原自由空战47项，新增参数25项、装配界面6项。预览纯度覆盖18科技的安装/精校投影、缺前驱和互斥；真实弹丸、电弧与激光负载检查界面数值的来源。隔离规则测试中的充足材料/固定靶用于校验数学，不冒充正常赚取。

界面测试另外使用正常击敌拾取的材料完成反弹安装和精校，检查只读预览、类型切换、弱档、时间冻结、实际单次扣料、保留旧炮、空库存/前驱/终极锁、结果只读、返回页面及清除输入。`npm run build`完成类型检查和185模块构建，`git diff --check`通过。

## 正常成长完整状态对照

`node build/qa/Stage-276/compare-combat.mjs`将基线与本轮World使用相同正常开局、输入和赚取组装，三路线×种子1337/9001各300秒。每6帧及最后一帧比较完整序列化World，包含私有计时器、随机数、弹丸、掉落、组件、悬赏、贡献和敌人；18006个状态均精确相等，每组3001次。里程碑哈希与实际组装序列保存在combat-equality.json。

| 路线 | 种子 | 时间 | 击破 | 分数 | 完整状态对照 |
|---|---:|---:|---:|---:|---|
| 弹道 | 1337 | 300秒 | 370 | 19635 | 相等 |
| 弹道 | 9001 | 300秒 | 370 | 19535 | 相等 |
| 电磁 | 1337 | 300秒 | 363 | 19060 | 相等 |
| 电磁 | 9001 | 300秒 | 366 | 19365 | 相等 |
| 光学 | 1337 | 300秒 | 358 | 18965 | 相等 |
| 光学 | 9001 | 300秒 | 358 | 18890 | 相等 |

该证据支持本轮参数共用与渲染未改变这六组战斗，不是所有输入、真人难度或设备性能证明。

## 实景检查

Browser插件未提供，使用CUA Edge扩展browser3和原生可见按钮，不通过页面脚本改World。验证页为5255/tools/visual-fixtures/flight.html，正常开局、虚拟60Hz、全知二维测试指针；测试档案使用隔离Session。生产5178采用真实时钟和原生操作。

| 检查 | 结果与证据 |
|---|---|
| 页面身份/非空/错误覆盖层 | 实际标题自由空战；生产脚本index-Dh6LHSJM.js，主页/装配/树均有真实图片和原生按钮，无框架错误层 |
| 首次正常材料/确认 | 15.333秒11击破，4合金；图片反弹预览World不变，确认扣3合金、split保留；actual-install.json及phone-preview-final.png |
| 实际强化反馈 | 15.533秒战斗显示反弹回执、对应炮位收束与短火花；phone-feedback-final.png；推进0.2秒是正常帧泵，不是注入 |
| 后期叠加参数 | 120.8秒95击破14组件、蜂群武库；手机390×693显示7主伤、6×5翼炮、0.1秒、38/1.1秒轨道炮及反弹/跳击/追击；phone-late-current.png |
| 三系与桌面 | 2002×1096画布电磁/光学页面，显示真实连锁、磁暴、三束和灼烧；desktop-electric-final-full.png、desktop-optical-weak-final-full.png |
| 弱档/终极锁 | weak-final.json中World和firepower均相等；已选武库后日冕无确认按钮，desktop-locked-final-full.png |
| 最终生产入口 | 5178原生激光出击→左上火力→科技树→日冕图片试装；显示7个未装前驱、完整路径参数和本节点材料，无确认。暂停→火力→返回仍暂停，回主页完成；production-future-final.png、production-dom.json |
| 控制台 | 最终生产和验证页error/warn均为空，browser-health.json |

初次完整路径图和首次当前参数图保留为过程候选，*-final与phone-late-current为最终检查。一次CDP观察超时，同一标签再次读取恢复；HTML修改触发Vite正常重载，随后重新走完最终流程，没有重启服务。手机图为桌面Edge中的390×693真实画布；整图和观测DOM矩形保留，crop-manifest.json记录等像素裁切，不是Android/微信真机截图。

## 构建与保存

完整可运行目录`build/playable/Stage-276`：55文件、13848041字节，index-Dh6LHSJM.js。dist、冻结目录和5178所有文件逐一HTTP200/SHA256相等，证据frozen-build.json及http-all.json。保留旧canvas入口和历史构建，无新ZIP或原生EXE。

源码提交、推送和独立技术博客档案提交以各Git记录与收尾日志为准。长期档案按五目录保存设计、过程、测试、截图、可玩目录和本轮改动源码，不能仅保存此报告。

## 未完成与风险

未做全仓历史模式回归、Android/微信接入、手机真机或长期真人试玩；没有测量设备FPS或宣称发布质量。本轮未增加敌种/关卡，也未证明长期构筑与关卡重复问题已解决。图示理解度、升级吸引力、候选数值和视觉方向仍待真人反馈，总体目标继续。
