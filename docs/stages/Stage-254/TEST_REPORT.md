# Stage254 验证与边界

8项实际击破/四拍/三变体/暂停清理/原战利品回归通过，6项新六帧/四槽/前景层及相邻残骸检查通过，共14不同相关项。explosion-render文件以名称筛选，另142项未运行；没有本轮全仓通过结论，旧254失败未整体解决。typecheck与最终vite build通过。

新源图1536×1024和运行768×512逐格透明/可见/边缘检查通过；导出542821字节，解码1.5MiB，原始图与hash/provenance留档。原四爆炸槽、三残骸、1.35秒解体及2.2秒领奖均保持；新主图0.72秒在第4拍替换旧核心。

真实Edge正常输入分别于78.8333/161.25/254.65秒击破三种首领，79.75/162.1667/255.5667秒各查看0.933秒破裂高峰，原三次蓝图均实际领取，HP3。标准档三变体有真实图；桌面2002×1188及390×844可读，截图文件为390×843是捕获边界取整。不是FPS证据。

真实旧新79.75秒完整World精确比较失败，只差player.x/px各1.648459e-12；保留原值报告，不隐去后冒称精确同态。同尺寸自有合成DOM控制器10个正常成长完整World节点（3击破/3峰值/3战利品/最后领奖）则严格相等，修正弱档切换后再次验证相等；它不是逐回调或像素证明。

## 弱档验证更正

从同刻标准/弱档截图ROI差0发现验证工具存档clone问题，四模板已修，运行只读诊断effectsMode和控制器实际weak断言通过。Stage251-253这些正常流程旧弱档实景结论撤回，源阶段文档与长期档案均追加更正。原图保留，旧Stage254名为mobile-weak但修复前取得的图不得作弱档证明；实际有效图为reactor-weak-fixed-mobile.jpg及对应weak-fixed-state.json，标准为reactor-standard-fixed-mobile.jpg。两者实际诊断standard/weak、视口390×844，完整World严格相等，爆裂ROI平均通道差14.138，弱档平均67.174低于标准78.411，确认实际减亮。未声称减小解码内存或已经验证低端性能。

首次视口设置没作用于当前新标签，已另存pre-viewport文件并使用当前标签CDP核验尺寸；重载后再确认尺寸，未复用桌面图作手机验收。最终旧版对照页重载观察超时，已完成证据提取后关闭；未因此重启游戏或丢弃结果。

复现：npm run assets:reactor；node tools/build-boss-rupture-preview.mjs；node tools/check-boss-rupture-fixture.mjs current（或old）。Vitest：tests/explosion-render.test.ts使用名称real boss kill|freezes the boss sequence|makes room within|keeps chapter artwork筛选；另完整运行tests/boss-reactor-render.test.ts、tests/boss-salvage-render.test.ts和tests/boss-armor-fragments.test.ts。浏览器由Vite服务tools/visual-fixtures/boss-rupture.html，version=old为固定旧源。所有未执行测试如上，整体目标未完成。


## 最终交付核验

正常三首领78.8333/161.25/254.65秒击破及三蓝图实际领取完成，HP3；三种标准实景、旧新对照、桌面与手机图留档。验证工具切档修复后重新正常开局取得真实weak/standard同刻390×844图，运行flag与像素ROI同时证实减亮、World严格相等，未把此前错误截图当修后弱档。受影响历史阶段已追加更正。

14相关检查（另142项筛选未运行）、修后控制器弱档真实断言、typecheck和最终vite build通过。49资源8254725字节逐文件核对dist冻结build/playable/Stage-254，固定5178真实Edge脚本canvas-preview-CA-oC4O1.js、控制台无警告/错误；备用5337未启动，无ZIP。弱档不代表GPU内存降低，低端性能/人类爽感/全仓旧254失败仍待后续，整体目标未完成。
