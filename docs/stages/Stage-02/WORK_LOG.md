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

## 连续工作：启动外观与原生适配

开始核查Android模板图标、启动页、系统栏、备份和合并manifest。将制作与已有原创机甲一致的启动资产候选并保留源文件/提示词，重新构建核验；候选不代表用户品牌签收。当前无真机，不能把资源预览代替原生运行证据。

- 内置imagegen制作透明机甲候选；生成结果1254px且未遵守提示中的中心留白，脚本重新等比适配，五档显著alpha半径32.22–32.41dp，均小于33dp安全圆。源图、提示词、导出记录保留。
- 接入系统SplashScreen和深色结束主题，super.onCreate前安装；按Capacitor实际源码固定SystemBars DARK浅色前景及css安全区。补新版cloud/device-transfer排除规则，旧系统fullBackupContent=false。
- 移除11个模板启动PNG和4个无引用XML，可从d6002e7恢复。第一次新资源构建lint有11警告，其中5项legacy图标满矩形警告；加入旧版图标圆角透明外沿并删除空旧版本目录，最终0错误/5警告，没有隐藏检查。
- 最终完整Android命令通过，34秒，APK4964969字节，签名通过。编译后解码16张本地图标/启动图，RGBA与源导出完全一致；13个Web资源哈希一致，两个空兼容文件，无模板splash.png；最终权限无新增网络/敏感项。
- 浏览器预览初次CSS单色遮罩未显示且图标未模拟系统图层缩放；修为从alpha导出的单色示意与150%前景层，复查圆形/圆角/48px/单色。桌面和手机全页预览截图已保存，明确不是原生界面。移动预览单列，无文字横向溢出。
- 本轮未更改共享游戏规则/渲染，未重跑34项战斗全套；沿用前轮证据。adb仍无设备，不宣称真机启动、系统栏、备份或音画体验通过。
- 旧APK与微信交付目录保持原记录，新的候选输出至Stage-02-launcher；长期档案同步独立Git。详见LAUNCHER_VALIDATION.md。

## 官方依据

- https://capacitorjs.com/docs/config
- https://capacitorjs.com/docs/updating/8-0
- https://capacitorjs.com/docs/apis/app
- https://developer.android.com/develop/ui/views/launch/splash-screen/migrate
- https://developer.android.com/develop/ui/compose/system/icon_design_adaptive
- https://developer.android.com/identity/data/autobackup
