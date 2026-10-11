# Stage-25 / Android 模拟器启动复核（进行中）

用户暂无可用 Android 手机。目标是取得独立 APK 的原生流程证据；模拟器结果不替代真机性能、触控、音频或发布验收。游戏运行基线仍为 Stage-24，本阶段尚未修改游戏或重建候选。

## 当前发现

- 实际读取现有 AGENTS、README、策划、设计决策与 Stage-06/24 记录。Stage-06 的两项 NativeFlowTest 仅有编译证据，未运行。
- 开始时 adb 无连接设备，只有既有 adb 服务；没有遗留 emulator/qemu 实例。
- 复用专用 AVD `zi_gate_stage06_api35`，数据位于项目 build/emulator/stage06-api35。没有新建 AVD、安装 SDK 或接受许可。
- 第一次以无窗口、无快照、SwiftShader、关闭 Vulkan、WHPX 启动。adb 仍 offline，QEMU CPU 时间 0.546875 秒，日志停在 WHPX 初始化。未进入 Android，不能归因为游戏故障。
- 检查父子 PID 与该 AVD 命令行后，明确停止本次实例。改前台 exec 软件 CPU（accel off）模式；20:07:42 启动，20:08:31 仍 offline，QEMU CPU 时间停留 0.3125 秒，日志最后更新时间 20:07:43。该观察窗口未启动成功，不代表已确定故障原因或排除更长启动时间。
- 最终按父子 PID 和专用 AVD 路径核验后停止软件实例；adb 无设备，未留下本次 emulator/qemu 进程。未修改 Windows 虚拟化、安全设置或系统网络。

## 验证边界

没有安装或运行本阶段 APK，没有执行 instrumentation，没有 Android 游戏截图；不能报告两项测试通过、离线运行通过、真机或上架验收通过。原始环境日志保存在 build/evidence/Stage-25/environment；公开档案只同步筛选后的非敏感诊断。

## 遗留

原生启动环境、两项流程测试、微信工具/双方设备、人评及渠道发布仍待完成。继续开发目标保持有效。
