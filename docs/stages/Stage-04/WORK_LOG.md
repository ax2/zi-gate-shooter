# Stage-04：Android运行依赖许可证据

2026-10-11，进行中；起始源码c9404dd，档案76c4b1c。上一目标轮完成输入修复、双端候选与可追踪证据，判为有进展。

## 目标与发现

检查当前README、AGENTS、策划、设计决策、Stage-03日志及Android源码。仍无真机证据，不能完成上架目标。发现THIRD_PARTY_NOTICES明确只覆盖直接JavaScript运行库；Android传递依赖许可清单仍为空。此轮补实际debug/release运行依赖图、上游POM声明、二进制内许可/NOTICE原文与对应哈希，并建立依赖变更校验。排除编译工具和测试依赖，不把名称猜测当作许可证据。

先前准备的输入/生命周期检查显示微信取消事件仍整体取消，但此轮优先填补已知发布许可缺口，不新增游戏系统。现有微信行为保留并标注。

## 验证计划及边界

从Gradle实际解析结果导出，而非手写AndroidX列表；缓存只作为已解析上游构件来源。许可缺失或依赖变化必须失败并要求维护清单，不能默认标MIT/Apache。打包后逐文件核验，检查来源与路径不含凭据或机器缓存路径。此为工程许可清单和打包证据，不能替代法律审查、真机或渠道验收。

## 实施与发现

首次通过旧resolvedConfiguration取得所有产物，触发Capacitor项目的Android多变体歧义而失败；改为incoming.artifactView仅过滤外部ModuleComponentIdentifier，保留原始运行图且不修改游戏依赖。随后离线导出成功。core相同AAR在视图中出现两次，按文件名+SHA去重；没有删除运行库。

实际debug/release各50坐标、46个二进制和4个元数据坐标。所有当前外部坐标的上游声明为Apache-2.0；Guava listenablefuture本身没有licenses块，递归保留父guava-parent 26.0-android。51份POM保存原文；8处二进制内嵌许可按内容去重为1份。3个Capacitor npm运行包MIT原文从安装包复制；Apache标准许可与Cordova rel/14.0.1 LICENSE/NOTICE从官方来源获取，记录URL与SHA，不下载商业资产。

工具产出清单和合并许可；Gradle preBuild依赖verifyRuntimeLicenses，重新解析实际运行图并逐字节比对跟踪原文。未知许可、缺声明、缺POM、图/二进制/许可变化或新本地项目均阻止继续，不自动刷新。legal/**禁止Git换行转换，原有.gitattributes规则保留。ANDROID_NOTICES.txt及android-runtime.json打入APK，历史Stage-03完整目录保留；本轮游戏规则、画面、数值与音频未变更。

## 验证与失败记录

新增两项许可回归：未知/缺失声明、原文哈希变化、新本地项目拒绝；真实临时文件验证构件变化和删除归属原文失败。第一次目标测试2项212ms通过。完整npm test为10文件44项通过、59.32秒；类型检查在Android构建中通过，微信候选仍536725字节。

npm run build:android完整成功，Gradle36秒；preBuild许可任务实际执行。APK4983913字节，SHA256为4624E67F378120A2573A50DDFEB994CEA60E10775BF4B03A87877F850BA47F60，debug签名通过。15网页资源逐哈希、2空兼容文件、16张原生图像RGBA核验通过；App lint 0错误/5警告，不隐藏。未构建release签名APK；release仅解析运行图。

最终将POM获取改为Gradle标准ArtifactResolutionQuery，避免假设用户缓存布局。首次离线查询缺少该查询形式的缓存而失败，补充明确坐标错误后使用既有构建代理在线运行完整构建，86秒成功；清单及APK哈希与初次构建一致。未降低缺POM失败要求。随后对最终导出方式重做离线负对照。最终包核验增加aapt实际权限白名单：只有AndroidX内部DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION；任何新增声明或使用权限都会拒绝候选核验，不只检查源manifest。

另做真实负对照：临时向合并许可追加标记，运行离线:app:preBuild，退出1并明确License evidence changed: ANDROID_NOTICES.txt，证明构建链会拒绝变化；finally恢复原字节，前后SHA一致，恢复后完整清单正向核验通过。日志保留negative-prebuild.log，失败为有意验证，不是交付包失败。

## 证据边界与后续

本轮无可视UI修改，未新增运行截图，不把历史Stage-03截图作为本轮新增画面证据。native-flow自动用例是共享Runtime返回键模型，不能证明Android App插件回调实际执行；以前报告中“原生桥接”应按此边界理解。

仍无真机安装/性能/声音/安全区验收。许可源树嵌套声明人工审查、用户可达许可界面、真人试玩与完整视觉音频签收、正式签名及渠道审核继续待验。工程清单和文件打包不是法律审查结论。候选包、源文证据、构建/负对照记录与文档同步长期档案；源码与档案分别Git追踪，提交标识见用户交付状态。
