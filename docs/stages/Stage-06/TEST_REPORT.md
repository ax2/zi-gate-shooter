# Stage-06验证记录（进行中）

日期：2026-10-11。

| 项目 | 当前证据 | 结论 |
|---|---|---|
| 设备 | adb devices -l为空，无已建AVD | 无可运行目标 |
| SDK测试环境 | emulator 37.2.12、API35 AOSP x86_64 revision2已安装；独立AVD已创建，WHPX检测返回0 | 安装完成，未成功启动 |
| 模拟器启动 | 前台WHPX最终exit1，未进入系统；关闭Vulkan的软件实例仍存活但ADB offline | 原因未定，非游戏测试失败 |
| 原生测试编译 | `android/gradlew.bat --no-daemon --console=plain :app:assembleDebugAndroidTest`，BUILD SUCCESSFUL，1分46秒 | 两项测试编译通过，未执行 |
| 游戏生产代码 | 未修改 | 沿用Stage-05候选，不重复宣称新游戏包通过 |
| 原生触控/返回/保局/后台 | NativeFlowTest已实现待执行 | 未验收 |
| 手机性能/音画/发布 | 无新增证据 | 未验收 |

新增测试位于android/app/src/androidTest/java/com/ax2/zigateshooter/NativeFlowTest.java；使用Instrumentation真实触控、返回键、Activity生命周期和WebView只读诊断。测试包独立，不打入游戏APK。移除了模板错误包名测试与无业务意义的加法测试。

环境具备后可运行`:app:connectedDebugAndroidTest`；本项目增加`powershell -NoProfile -File tools/test-android-native.ps1 -Serial emulator-5554`，只允许已启动的隔离模拟器，重建并安装游戏/测试APK，直接运行指定两项测试，保存构建、原始instrumentation输出、APK哈希、系统/屏幕/WebView版本。脚本PowerShell语法检查通过，尚未实际运行，不宣称离线状态已验。

后续仍需保存运行截图。两项测试不替代完整离线重启、进程死亡、低端30分钟长局或真人体验。

Android网页使用ES2020与现代浏览器能力，最低WebView兼容策略仍需实测确定；minSdk24不等同于已通过Android7设备验收。当前只有环境诊断日志，无原生游戏截图。
