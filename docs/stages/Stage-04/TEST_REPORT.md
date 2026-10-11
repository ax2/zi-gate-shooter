# Stage-04验证记录

2026-10-11。补齐Android运行图许可工程证据及构建门禁；未达到上架验收。

| 检查 | 实际结果 | 范围 |
|---|---|---|
| Gradle运行图 | debug/release各50坐标，46个二进制、4个元数据 | 实际解析，非手写库名；未构建正式release包 |
| 许可原文来源 | 51份POM含Guava父POM，8处内嵌许可去重为1份，3个npm运行包MIT | 当前构件及POM、二进制哈希；源树嵌套声明人工审查未完成 |
| 外部来源 | Apache官方许可、Cordova rel/14.0.1 LICENSE/NOTICE | URL与内容SHA保存于legal；不推断其他版本 |
| 完整npm test | 10文件44项通过，59.32秒 | 新增2项许可反向回归；模型不是手机性能或真人体验 |
| 类型检查 | Android构建内通过 | 无游戏源文件变更 |
| Android构建 | 首次Gradle36秒；最终POM标准查询版86秒成功，APK哈希相同，debug签名通过 | 开发签名，不是上架签名 |
| 包内核验 | 15网页文件SHA一致、2空兼容文件、16图像RGBA一致 | 新增许可原文和清单实际进入APK |
| App lint | 0错误/5警告 | 沿用平台与版本提示，未隐藏 |
| 最终权限白名单 | aapt核验仅AndroidX内部DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION | 新增声明/使用权限拒绝核验，无网络或敏感权限 |
| 实际负对照 | 修改许可→:app:preBuild退出1；恢复原字节→正向清单验证通过 | 确认实际构建链拒绝归属文件变化，不只测辅助函数 |
| 微信候选 | 536725字节，与本轮前一致 | 未执行开发者工具或真机 |
| 浏览器/设备 | 本轮无UI变更，未新增截图或原生运行测试 | 历史截图不能作为本轮新增证据 |

APK4983913字节，SHA256：4624E67F378120A2573A50DDFEB994CEA60E10775BF4B03A87877F850BA47F60。build/releases/Stage-04/android保留完整包、BUILD_RECORD和PACKAGE_CHECK；Stage-03历史包保留。候选包名、名称、形象和数值尚未正式签收。

## 反向检查与维护

新测试覆盖未知许可URL、缺声明、嵌入原文哈希错误、未知本地项目，及构件SHA变化/归属文件缺失。真实Gradle负对照临时改变ANDROID_NOTICES.txt，错误精确指向该文件；原文在finally逐字节恢复并核验。不会为通过测试自动刷新跟踪清单。

导出首次遇到本地Android变体选择歧义，修复为只从外部构件视图取二进制，运行依赖图本身不修改；输出无机器缓存路径和敏感凭据模式匹配。POM公开上游作者与SCM信息属于来源，不是账号凭据。

最终POM读取使用Gradle标准构件查询。首次离线运行该查询的缓存不完整而失败，使用现有构建代理在线取得所需元数据后，完整构建与逐字节清单核验通过；最终离线负对照重复执行。没有通过猜测许可或忽略缺POM绕过错误。

复现：Android目录运行gradlew --offline :app:exportRuntimeInventory；项目根npm run licenses:check；npm run build:android；npm test。新机器需先让Gradle解析依赖建立缓存。显式审阅后才可npm run licenses:refresh，再审阅全部差异；本轮完整许可目录以Git保持原字节。

## 未完成

许可文本已随APK分发，用户可达许可查看界面仍待实现与验证。尚无全源码嵌套第三方声明人工审查或法律/渠道审核结论。没有真机安装、离线启动、Capacitor原生生命周期/返回键、低端长局/温度/内存、音频听审及真人公平性证据。native-flow.test.ts只验证共享Runtime模型。正式签名、渠道与品牌批准仍待完成，目标继续。

许可资料依据：[Apache原文](https://www.apache.org/licenses/LICENSE-2.0.html)、[Apache分发说明](https://apache.org/legal/apply-license.html)、[Cordova对应NOTICE](https://raw.githubusercontent.com/apache/cordova-android/rel/14.0.1/NOTICE)。上述资料用于维护来源，不将其当成应用已通过审核。
