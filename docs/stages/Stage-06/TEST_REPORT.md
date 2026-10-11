# Stage-06验证记录（进行中）

日期：2026-10-11。

| 项目 | 当前证据 | 结论 |
|---|---|---|
| 设备 | adb devices -l为空，无已建AVD | 无可运行目标 |
| SDK测试环境 | 官方sdkmanager安装emulator与API35 AOSP x86_64进行中；下载线程网络读取，文件暂为0字节 | 尚未安装成功 |
| 原生测试编译 | `android/gradlew.bat --no-daemon --console=plain :app:assembleDebugAndroidTest`，BUILD SUCCESSFUL，1分46秒 | 两项测试编译通过，未执行 |
| 游戏生产代码 | 未修改 | 沿用Stage-05候选，不重复宣称新游戏包通过 |
| 原生触控/返回/保局/后台 | NativeFlowTest已实现待执行 | 未验收 |
| 手机性能/音画/发布 | 无新增证据 | 未验收 |

新增测试位于android/app/src/androidTest/java/com/ax2/zigateshooter/NativeFlowTest.java；使用Instrumentation真实触控、返回键、Activity生命周期和WebView只读诊断。测试包独立，不打入游戏APK。移除了模板错误包名测试与无业务意义的加法测试。

环境具备后运行`:app:connectedDebugAndroidTest`；应分别保存XML结果、设备系统/屏幕/WebView版本和截图。两项测试不替代完整离线重启、进程死亡、低端30分钟长局或真人体验。
