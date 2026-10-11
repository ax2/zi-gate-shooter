# Android发布准备

2026-10-11。用户已确认独立Android APK与微信小游戏并行。当前为内部验证候选，不是上架包。

## 实现与复现

共享纯TypeScript规则、Canvas画面、原创候选素材。Capacitor core/android 8.5.3，App 8.1.2，CLI 8.4.3锁定。CLI最初8.5.3引入xcode/uuid开发依赖审计问题，使用同主版本8.4.3后npm安装审计为0漏洞；这不代表Android依赖或应用已经完成安全审查。

本机JDK21、Android SDK36、Build Tools36，Gradle8.14.3。运行 `npm ci`、`npm run build:android`。SDK路径写入忽略的local.properties，不提交机器路径；代理只在构建子进程临时配置，不记录凭据。资源全部打入APK，不使用开发服务器。正式渠道和最低验收设备仍待确定。

构建脚本执行assembleDebug、lintDebug、apksigner校验，再保存完整APK与SHA256记录至build/releases/Stage-03/android。脚本支持-Stage参数（格式Stage-数字两位），当前默认Stage-03；历史Stage-02目录保留。当前applicationId为候选com.ax2.zigateshooter，versionName0.1.0/versionCode1，minSdk24/targetSdk36只是编译配置，不等于Android7起所有设备均已验证。

## 交互与权限

竖屏战斗区域保持9:16，宽屏居中留边。画布尺寸与触控都按实际安全区域计算。Android返回键在战斗时暂停，在结果页返回菜单，在菜单退出；暂停中再次返回不自动丢弃当前局。后台/失焦暂停、停止声音，回前台仍需手动继续。上述有共享层单测，原生插件、系统栏与触控必须真机复核。

源manifest未声明网络或敏感权限，未接入登录、广告、支付、后台、云存档。必须继续检查合并后的APKmanifest，不能只凭源码认定最终权限。最高分和设置只保存在本地；不保存未结束局。

## 发布退出条件（均需实际证据）

- 可重复构建、lint无错误、签名验证、最终权限与离线资源清单核验。
- 真机安装/启动/离线、返回/暂停/恢复、电话或系统打断、进程重启、存档损坏与音频恢复。
- 低端和主流Android设备的帧时、内存、温度、触控延迟、30分钟正常长局；不能用桌面或免伤压力模拟代替。
- 刘海/挖孔/手势区域、大屏/分屏/Android16旋转行为的实际画面与输入检查。
- 原创启动图标、启动页、名称与完整视觉/音频签收。当前已替换为原创机甲候选与系统SplashScreen，五档密度和APK像素一致性已检查；真机过渡与品牌签收未完成。
- 完整Android传递依赖许可清单；当前THIRD_PARTY_NOTICES仅含直接JavaScript运行库声明。
- 用户持有的正式签名及备份、正式包名确认、选定渠道的资料/隐私说明与审核规则核查，必要时补AAB；尚未签名发布或提交商店。

参考：[Capacitor](https://capacitorjs.com/docs)、[App API](https://capacitorjs.com/docs/apis/app)。

## 最新启动资产修订

启动候选与检查见stages/Stage-02/LAUNCHER_VALIDATION.md。旧包保留build/releases/Stage-02-d6002e7/android、build/releases/Stage-02/android与原用户输出；最新输入修复构建位于build/releases/Stage-03/android，见Stage-03/TEST_REPORT.md。npm run assets:launcher可重复导出既有原创源图，不会重新调用生成服务。

系统栏固定SystemBars DARK（浅色文字/图标）与深色窗口底，保留css安全区和cover初始提示。启动Activity在super.onCreate之前安装AndroidX SplashScreen，统一深色背景、静态机甲标记和结束主题，无额外Activity、人工延时或启动网络请求。Android12+显式排除cloud与device-transfer全部本地数据域，旧系统禁用fullBackupContent；真实系统行为待设备检查。

依据：[Android启动迁移](https://developer.android.com/develop/ui/views/launch/splash-screen/migrate)、[自适应图标](https://developer.android.com/develop/ui/compose/system/icon_design_adaptive)、[系统备份规则](https://developer.android.com/identity/data/autobackup)。
