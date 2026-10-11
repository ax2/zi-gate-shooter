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
- SDK安装进程最终exit0，API35默认x86_64 revision2镜像安装成功。创建独立zi_gate_stage06_api35 AVD，数据位于build/emulator/stage06-api35；未输入新许可接受，未修改系统虚拟化配置。
- 启动诊断：后台WHPX与软件实例都停留ADB offline、CPU时间不再增长；明确停止这些本次创建的实例。为排除后台输出管道假设，改前台exec会话运行WHPX，同样未进入系统，最终exit1、ADB设备消失，无明确QEMU错误。Windows Application事件发现同目录crashpad_handler.exe异常0x80000003；只记录相关事实，不认定因果。未保存其他应用事件。
- 当前再试前台软件CPU/软件GPU并关闭Vulkan，进程仍存活、ADB offline，未进入Android。原生测试仍未执行；该进程下轮应先继续检查，不因观察超时重复启动。过滤后的启动日志和environment.json保存在阶段环境证据，不包含ADB公钥行等无关标识。
- 兼容性核查：Android网页目标ES2020，使用ResizeObserver/100dvh等浏览器能力；minSdk24只是安装配置，不证明旧WebView可运行。尚未取得旧设备实测，不提高/扩大已验证兼容范围；后续需要最低WebView策略与实际运行证据。

## 依据

- https://developer.android.com/tools/sdkmanager
- https://developer.android.com/studio/run/emulator-commandline

## 遗留与发布

## 兼容修订与最终验证补记

- 软件实例长时间保持CPU0.45秒/ADB offline，无Android内核启动输出；本次明确终止会话，随后确认QEMU进程和ADB设备均消失。环境排查保留，原生测试仍未执行；不再留下待轮询的运行句柄。
- Android网页构建从ES2020改Chrome60语法目标。画布探测CSS env/dvh后选择安全区fallback/100vh，无ResizeObserver时保留window resize监听；许可页增加基础宽高、四边定位和padding，再增强现代CSS。未更改战斗、数值、素材或微信入口。
- 旧Stage-05网页bundle SHA256 7C643151D46A49F662269C81E39E120DE94E21E440A4B99C7B90503D0BB50B24，复制为隔离基线；在无ResizeObserver、CSS env/dvh探测false的QA页实际报TypeError: ResizeObserver is not a constructor并无游戏画面。新bundle同条件可显示菜单、正常开局，暂停于10.333333秒/10分/3HP；设置→许可→返回设置后同一时间/分数/生命/坐标/对象数保持。该夹具是当前浏览器API缺失模拟，不是旧Chrome或真机。
- 实际Android网页产物在IAB验证URL/title、1280×720与移动请求390×844（截图390×843）、画面非空/无错误遮罩、设置→许可→返回及控制台健康；最终许可39939字符，关闭后停留settings，最终控制台error/warn为空。原旧包异常属于隔离基线且日志按来源区分；未混入新产物无错误结论。视口已复原，QA页关闭。
- npm test完整10文件45项通过104.66秒；npm run build类型检查与Vite通过，保留早期Phaser大chunk警告。微信候选536981字节。最终Android构建49秒成功，APK4993210字节，SHA256 1B8392D4D39F175F3BC0ED19447FCAC216DE23C210F069A91B92215FCCD4EC4D；签名、15网页文件、16原生图像、50/50许可与权限白名单通过，App lint0错误/5警告。
- 构建/核验脚本默认Stage-06，历史候选目录保留。生产代码后仅调整默认输出阶段与文档，未重复全套测试。公开源码和持续档案分别提交；候选包、截图、QA夹具和记录同步用户outputs/Stage-06。

手机真机、低端长局、音画与品牌签收、微信工具/AppID和正式签名/渠道验收仍未完成。安装环境本身不证明游戏达标。
