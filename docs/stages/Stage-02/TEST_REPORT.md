# Stage-02验证记录

2026-10-11。双平台开发快照，未达到上架验收。

本文件记录首个Android候选d6002e7。后续启动资产与原生适配修订见LAUNCHER_VALIDATION.md；下表4.65MB包、19项lint警告和模板图标说明为历史结果，不能当作最新包状态。

| 检查 | 实际结果 | 证据边界 |
|---|---|---|
| npm test | 7文件、34项通过，63.47秒 | 300完整段回放按3轮分组；不是真人体验/真机性能 |
| 类型检查与Vite构建 | 通过；保留早期Phaser入口的大chunk警告 | Android/微信未携带该Phaser入口 |
| npm audit --omit=dev | 0漏洞 | npm已知运行依赖漏洞库，不含完整Android依赖审计 |
| npm run build:android | 完整成功；Gradle assembleDebug+lintDebug，44秒 | debug包，不是release签名 |
| App lint | 0错误、19警告 | 包括版本更新提示、竖屏/Android16、备份规则、模板资源、图标/启动图；未隐藏 |
| apksigner verify | 通过 | 仅证明debug签名完整性，不是发布资格 |
| APK资源核验 | 13文件逐文件SHA256匹配，另2个Capacitor空兼容文件，配置无server | 静态打包证据，原生断网运行待验 |
| aapt最终权限 | 仅com.ax2.zigateshooter.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION | AndroidX内部权限；无网络/敏感权限 |
| adb设备清单 | 无连接设备 | 未安装、未启动、无原生截图 |
| 浏览器动态检查 | 1280×720，T1/零加成、左侧等待进入首领，观察双列第1/2拍预警，3HP | 仅浏览器；保存帧在弹丸阶段，不能冒充预警截图 |

## 候选APK

文件zi-gate-shooter-debug.apk，4645218字节，SHA256：38E511F8202A56389F698F779D279FFE54B6A51AE4F1D3768B52B989430F9653。包名com.ax2.zigateshooter，0.1.0(1)，编译/目标SDK36、最低SDK24。最低SDK配置不是兼容验收结论。

微信候选代码与资源合计535871字节，仍需自己的AppID及微信工具/Android与iPhone真机验收。

## 失败与修复记录

首次Gradle下载超时，使用本机既有代理的进程级Java选项后成功。第一次完整编译已生成APK，lint因SDK盘符转义失败；修复后lint通过。随后导出SHA记录因Windows PowerShell缺Get-FileHash失败，改.NET流哈希后完整命令成功。APK静态验证初次将Capacitor新增两个空Cordova兼容文件判为额外文件；核实实际条目后只允许这两个路径且强制长度为0，不放宽任意额外资源。

全套测试曾31/32通过、聚合300回放超时两次（并行Gradle时81.69秒，独立61.12秒）；将相同300回放分为3个100种子用例后34项通过，未删样本或逐帧断言，未放宽每用例60秒时限。

## 未完成

微信开发者工具与双系统真机、Android APK安装/离线/原生生命周期/系统安全区、低端性能、正常长局、人类试玩、美术与声音签收、正式图标/启动页、完整依赖许可、正式签名、渠道资料与审核均未执行或未完成。当前模板图标仍是明确的内部占位。上架目标保持进行中。
