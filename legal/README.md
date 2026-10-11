# Android运行依赖许可证据

本目录记录当前Gradle解析的debug/release运行图，各50个外部坐标，46个AAR/JAR、4个纯元数据坐标；并保留3个直接Capacitor npm运行库许可。数量来自实际解析，不代表每个库的全部类都进入APK。编译工具、测试库、系统Android/WebView没有作为本应用依赖再分发，故不列入此图。新增本地运行项目会阻止构建，须先审阅。

- android-runtime.json：两个配置、坐标、上游许可声明、POM/父POM路径与SHA256、二进制SHA256、内嵌许可路径和SHA256。
- poms/：51份实际解析使用的POM原文。Guava listenablefuture 1.0的许可继承自guava-parent 26.0-android，保留完整父POM证据。
- embedded/：从AAR/JAR及其内嵌JAR提取的许可/NOTICE/COPYING原文，以内容SHA256去重。
- upstream/：Apache标准许可与Cordova rel/14.0.1 LICENSE/NOTICE原文；sources.json保留直接来源，主清单锁定内容哈希。
- npm/：直接复制安装包LICENSE原文。
- ANDROID_NOTICES.txt：运行坐标、完整许可与NOTICE合并文本，和主清单一起放入APK本地资源。上游归属保留，不能用本项目MIT替代。

Gradle :app:exportRuntimeInventory 导出当前debug/release图到忽略的build/android-licenses/resolved.json，使用标准POM构件查询而非假设本机缓存目录布局。:app:verifyRuntimeLicenses在preBuild前逐字节比对上述证据；版本、二进制、POM、NOTICE或本地项目变化都会阻止构建，不自动认定新库可发布。首次新机器需在线运行构建以取得依赖与POM查询缓存，之后可离线核验；缺失POM也会失败，不能从库名猜许可。

明确审阅依赖变更后，在项目根运行npm run licenses:refresh生成候选差异，再审阅全部Git diff，运行npm run licenses:check及Android构建。不要仅为让构建通过而刷新。legal文件以.gitattributes禁用换行转换和空白格式修正检查，保证上游证据字节稳定；上游POM原有CRLF及许可末尾空行按原文保留，完整性由SHA与逐字节核验检查。

工程清单与静态打包校验不等于法律审查或商店审核。Stage-05已在设置增加离线许可入口，正文随JS打包，浏览器实际Android网页产物核对全文与返回流程通过；原始随包文件仍保留。当前未完成源树所有嵌套第三方声明的人工审查；原生包安装、旧WebView与系统返回行为尚待验证，不以本目录宣称应用可上架。

依据：[Apache许可原文](https://www.apache.org/licenses/LICENSE-2.0.html)、[Apache分发说明](https://apache.org/legal/apply-license.html)、[Cordova对应版本NOTICE](https://raw.githubusercontent.com/apache/cordova-android/rel/14.0.1/NOTICE)。
