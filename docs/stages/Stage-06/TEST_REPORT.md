# Stage-06验证记录（进行中）

日期：2026-10-11。

| 项目 | 当前证据 | 结论 |
|---|---|---|
| 设备 | adb devices -l为空，无已建AVD | 无可运行目标 |
| SDK测试环境 | emulator 37.2.12、API35 AOSP x86_64 revision2已安装；独立AVD已创建，WHPX检测返回0 | 安装完成，未成功启动 |
| 模拟器启动 | 前台WHPX最终exit1；关闭Vulkan软件实例持续offline/CPU无增长，明确终止并确认无设备/进程 | 未进入系统，原因未定，非游戏测试失败 |
| 原生测试编译 | `android/gradlew.bat --no-daemon --console=plain :app:assembleDebugAndroidTest`，BUILD SUCCESSFUL，1分46秒 | 两项测试编译通过，未执行 |
| 网页兼容修订 | Chrome60语法目标，env/dvh能力分支，可选ResizeObserver与基础许可布局 | 当前浏览器缺失API回退通过，旧真机待验 |
| 原生触控/返回/保局/后台 | NativeFlowTest已实现待执行 | 未验收 |
| 手机性能/音画/发布 | 无新增证据 | 未验收 |

新增测试位于android/app/src/androidTest/java/com/ax2/zigateshooter/NativeFlowTest.java；使用Instrumentation真实触控、返回键、Activity生命周期和WebView只读诊断。测试包独立，不打入游戏APK。移除了模板错误包名测试与无业务意义的加法测试。

环境具备后可运行`:app:connectedDebugAndroidTest`；本项目增加`powershell -NoProfile -File tools/test-android-native.ps1 -Serial emulator-5554`，只允许已启动的隔离模拟器，重建并安装游戏/测试APK，直接运行指定两项测试，保存构建、原始instrumentation输出、APK哈希、系统/屏幕/WebView版本。脚本PowerShell语法检查通过，尚未实际运行，不宣称离线状态已验。

后续仍需保存运行截图。两项测试不替代完整离线重启、进程死亡、低端30分钟长局或真人体验。

Android网页已改Chrome60语法并补能力回退，但编译目标不证明整个WebView环境兼容；minSdk24不等同于已通过Android7设备验收。没有原生游戏截图。

## 最终构建与网页验证

- 完整npm test：10文件45项通过，104.66秒。npm run build类型检查/Vite通过；早期Phaser入口大chunk警告仍在，该入口不进入APK。
- Android：构建49秒；4993210字节，SHA256 `1B8392D4D39F175F3BC0ED19447FCAC216DE23C210F069A91B92215FCCD4EC4D`。debug签名、15网页资源、16原生图像、50/50运行图许可和最终权限通过；lint0错误/5警告。微信候选536981字节，未作微信工具/真机验收。

| 网页QA | 证据 | 结论 |
|---|---|---|
| 基线负对照 | 旧bundle缺少ResizeObserver夹具实际抛TypeError，无游戏画面 | 已复现 |
| 新包接口回退 | 无ResizeObserver，env/dvh探测false；菜单、开局、暂停、许可保局 | 通过指定模拟条件 |
| 页面身份/非空/遮罩 | 实际Android网页产物URL/title；1280×720与390×843截图有真实菜单/许可，无框架错误遮罩 | 通过 |
| 控制台 | 实际产物独立新tab error/warn为空；旧夹具异常单列 | 通过 |
| 交互 | 缺失API页10.333333秒/10分/3HP查看许可往返保持；实际产物设置→许可→返回settings | 通过 |
| 旧系统 | 未运行Chrome60或Android7，也未用模拟器运行游戏 | 未验收 |

使用frontend-testing-debugging技能；Browser插件缺失，按宿主要求使用CUA IAB，未另装Playwright。QA夹具只覆盖接口探测和缺失观察器，不模拟旧CSS解析引擎/完整WebView。桌面与移动截图已归档；无原生截图。最终视口覆盖已恢复。
