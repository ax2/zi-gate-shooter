# Android独立APK交付与验收

更新时间：2026-10-13。用户最新确认：先提供独立APK，商店稍后确定；微信小游戏目标不变。商店/AAB/渠道材料不作为当前APK交付的先决条件，但不因此降低原生运行、性能、原创素材与体验验收要求。

## 当前可用候选

Stage-35：`build/releases/Stage-35/android/zi-gate-shooter-debug.apk`，7821741字节，SHA256 `A548EE58CF1EB3A55AC6979824CF6D9363F73271DB230B02A833A903F56322B5`。这是开发签名的内部测试APK，尚未在Android设备上完成安装运行；不是正式发行签收。

已验证：170项共享/微信模拟回归、Android编译及lint、开发签名、33网页文件哈希、16原生素材像素、debug/release各50运行依赖坐标与最终权限。只包含本地资源，无开发服务器配置。具体证据见[Stage-35](stages/Stage-35/TEST_REPORT.md)。

## 复现

依赖版本以package-lock.json为准，Android配置以android工程为准。当前JDK21、SDK36、Build Tools36、Gradle8.14.3。本地运行`npm ci`，随后使用`npm run build:android -- -Stage Stage-NN`并选择尚不存在的新阶段号。Stage-61起必须显式指定阶段，已有输出会拒绝覆盖。构建执行许可检查、assembleDebug/lintDebug、签名与实际APK内容核验并输出完整APK和校验记录。不要把源码manifest或构建成功当作设备测试。

现有两项NativeFlowTest需要已启动的隔离模拟器：`powershell -File tools/test-android-native.ps1 -Serial emulator-5580 -Stage Stage-36`。脚本会安装测试APK并执行系统返回、许可保局、Activity恢复测试。此前只编译过测试，未运行通过；设备必须先确认boot_completed=1。

候选applicationId为com.ax2.zigateshooter，versionName0.1.0/versionCode1，minSdk24/targetSdk36。这些是编译设置，不证明Android7起设备均可运行。正式包名、名称、发行签名及升级策略仍需确认；不向用户索取私钥、密码或完整凭据。

## 必须补齐的质量证据

- 真正Android安装/冷启动/纯本地资源运行，返回、暂停、恢复、系统打断、进程重启、损坏存档和音频恢复。
- 低端及主流设备帧时、内存、发热、触控延迟与30分钟正常长局；网页/全知操作者/模拟器不能代替真机表现。
- 刘海、挖孔、手势区域、大屏及系统窗口行为下的画面与输入。
- 真人趣味、三阶/三武器视觉与声音、正式名称/原创图标签收；现有机械资产与光效均为候选。
- 可持续升级的用户控制发行签名及备份。当前开发签名只用于测试，尚未签发正式版本。
- 许可原文与NOTICE已随包，源码嵌套第三方声明人工审查仍未完成；不宣称法律或商店审核通过。

用户已说明暂无Android手机，不重复索要。Stage-36复核专用模拟器，结果以[该阶段日志](stages/Stage-36/WORK_LOG.md)为准。没有实际安装/运行记录之前，安装验收保持未完成。

## 历史证据

Stage-02启动资产、Stage-04运行依赖清单、Stage-05离线许可页面、Stage-06原生测试编译、Stage-25模拟器启动失败、Stage-33光效、Stage-34真实浏览器199.8秒、Stage-35诊断优化分别保留于docs/stages。历史候选与失败不覆盖，不再将旧阶段路径写成当前默认产物。


Stage-69（2026-10-14）：最新候选为build/releases/Stage-69/android/zi-gate-shooter-debug.apk，包含Stage-67/68动作，203项完整回归及37文件/16原生图校验通过；上文Stage-35为历史证据。见stages/Stage-69/TEST_REPORT.md。
Stage-76：原生验收脚本必须显式指定-Stage；确认模拟器已启动后先android:sync再编译，输出source.json记录提交与工作区状态。缺阶段/无设备拒绝已验证；完整原生流程尚未通过。
Stage-77最新候选：build/releases/Stage-77/android/zi-gate-shooter-debug.apk，207项完整回归及构建/lint/包内一致性通过。仍为开发签名、未设备运行；详见stages/Stage-77。
