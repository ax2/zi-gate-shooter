# Stage-02：Android独立发行入口（进行中）

2026-10-11。用户明确确认“同时提供独立Android APK和微信小游戏”，保留微信目标。当前目标仍为可上架质量，本阶段不是批准发布。

## 目标

复用TypeScript规则、原创素材、Canvas画面，新增离线Android入口、生命周期与返回键处理、可重复打包脚本及独立验收记录。不另建不同玩法，不加入登录/广告/支付/后台。

## 当前证据与决定

- 检查已有项目，无Android原生工程；本机已有Temurin JDK21与Android SDK34/35/36、Build Tools36、既有SDK许可记录，可复用通用工具链，不修改全局Java/SDK配置。
- adb当前没有已连接设备；不存在真机通过证据。
- 核对Capacitor官方配置/升级/App API文档与npm注册表，拟锁定core/android/cli8.5.3、app8.1.2；本地资源打包，不依赖开发服务器或在线资源。
- Android应用ID候选com.ax2.zigateshooter，产品名沿用未批准工作名。候选debug APK只作开发验证；正式签名、图标/名称签收、发布渠道和商店要求需后续核实。
- 微信构建保持独立，不带Capacitor。Android构建仅使用原生Canvas浏览器适配，不携带早期Phaser验证入口。

## 验证与风险

已安装依赖并创建原生工程，尚未完成真机验证。既有SDK许可文件不代表本项目已经通过任何商店审核。

## 持续工作记录

- 创建前检查本机工具链与许可文件，adb devices为空。仅复用通用JDK/SDK/Gradle缓存，不引入公司代码或配置。
- core/android锁8.5.3，app8.1.2；CLI8.5.3安装后审计发现3项moderate开发依赖问题，退到同主版本CLI8.4.3后安装审计为0漏洞。未使用force覆盖依赖。
- 新建Android入口、本地资源打包、返回键和pause/resume适配；安全区画布按实际DOM边界换算触摸。共享流程单测通过，不能代替原生设备检查。
- 首次Gradle下载超时；按本机既有HTTPS_PROXY仅在子进程临时配置Java代理后成功下载8.14.3，没有跳过TLS验证或修改全局环境。
- 初次编译生成APK，但lint失败：local.properties的Windows盘符冒号未转义。修正构建脚本后重跑编译与lint，不建立基线隐藏错误。
- 全套测试最初31/32通过，300种子聚合回放在并行Gradle时81.69秒超时；独立重跑仍超60秒。拆为第1/2/5轮各100种子用例，保留全部种子、逐帧断言和每用例60秒限额，待复跑结果。不能将超时记录解释为已通过。
- 首领两拍与奖励窗口已在Stage-01日志记录；当前阶段新增Android流程单测。模板图标/启动页仍是内部占位，正式美术/音频签收、真机性能、微信工具/AppID、正式签名与商店审核均未完成。

## 本次验证与保存结果

- npm test最终34项通过（63.47秒），类型检查和浏览器构建通过。npm audit --omit=dev为0漏洞。
- Gradle编译与lint修复后通过；导出过程因Windows PowerShell缺Get-FileHash再次失败，改用.NET流哈希，完整命令最终成功。APK4645218字节，debug签名校验通过。
- App lint仍有19项警告，未隐藏；详见TEST_REPORT.md。SDK/Gradle模板依赖的原生库基线不等于本项目自行忽略新错误。
- 包内13项资源逐文件哈希一致；仅允许Capacitor生成的两个0字节兼容文件。最终aapt权限只含AndroidX应用内部接收器权限，无网络/敏感权限。真机未连接，不能宣称离线启动已验证。
- 浏览器宽屏实际观察到首领“第1拍/第2拍”双列预警，数字和危险层级清晰；保存截图是在弹丸阶段，不伪称预警帧或原生运行图。暂停保存当前验证局。
- Stage-02候选APK、微信目录、验证记录与真实截图同步到用户输出，长期档案分别追踪。当前仍是开发快照。

## 官方依据

- https://capacitorjs.com/docs/config
- https://capacitorjs.com/docs/updating/8-0
- https://capacitorjs.com/docs/apis/app
