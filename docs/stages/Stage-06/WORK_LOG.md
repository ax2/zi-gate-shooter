# Stage-06 / Android原生运行验证

日期：2026-10-11。目标仍为微信小游戏与独立Android APK达到可上架质量；本阶段补原生运行证据，不把模拟器当成真机验收。

## 目标与起点

现有源码e89524f，Stage-05候选APK4992734字节。当前adb devices无设备，SDK无emulator/system-images，无AVD。已安装cmdline-tools 17.0及既有SDK许可。sdkmanager实际列表提供emulator 37.2.12、system-images;android-35;default;x86_64 revision 2。

拟用官方工具安装AOSP测试环境；不自动接受新许可，不修改系统虚拟化/安全设置。先验证安装、离线启动、原生返回和后台恢复，再决定需要的修复。过程未执行项保持待验。

## 工作日志

- 已检查项目规则、README、策划与Stage-05证据；本阶段未改游戏逻辑。
- 首次SDK安装等待下载且临时文件为0字节，明确中止原进程后按既有HTTPS_PROXY配置SDK HTTP代理重试，未输入许可接受。重试进程仍在网络读取，jcmd线程诊断指向LegacyDownloader.downloadFully；不是已安装或已启动。curl官方同一资源HEAD返回200和455342868字节，不能据此认定下载完成。
- 删除包名错误的ExampleInstrumentedTest与仅验证2+2的ExampleUnitTest，新增NativeFlowTest两项：真实WebView菜单启动→触控开局→系统返回暂停→设置/许可→系统返回关闭且保局→手动继续；Activity CREATED/RESUMED往返后保持暂停且手动继续。只读诊断，不注入生命/奖励/坐标，不增加生产调试入口。
- `:app:assembleDebugAndroidTest`成功，104任务（28执行、76复用），1分46秒；生成测试APK。这里只证明原生测试可编译，不是两项运行通过。原生运行、截图和离线设备验证均未执行。
- 后续检查：emulator/source.properties已记录37.2.12，`emulator -accel-check`返回0并确认既有WHPX可用，未修改系统设置。安装已推进至API35 AOSP系统镜像（官方HEAD 782404023字节），镜像仍在下载；avdmanager list avd为空。不能把模拟器程序安装成功写成系统镜像或AVD已就绪。
- 增加tools/test-android-native.ps1，只允许显式指定已启动模拟器；重建/安装两个APK，记录哈希、系统/屏幕/WebView与instrumentation原始结果，要求2 tests通过且无失败标记。PowerShell Parser语法检查通过，运行待验；不改系统网络设置，不写成离线验收。

## 依据

- https://developer.android.com/tools/sdkmanager
- https://developer.android.com/studio/run/emulator-commandline

## 遗留与发布

手机真机、低端长局、音画与品牌签收、微信工具/AppID和正式签名/渠道验收仍未完成。安装环境本身不证明游戏达标。
