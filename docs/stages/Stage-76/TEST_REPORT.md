# Stage-76 原生验收输入一致性（2026-10-14）
修复tools/test-android-native.ps1直接Gradle构建、可能沿用旧android网页资源的问题。要求显式Stage（支持三位及以上）；先确认隔离模拟器和boot_completed，再运行android:sync并在失败时中止，不继续安装。记录sourceCommit与workingTreeDirty，不把dirty提交号声称完整源码快照。输出目录加入随机短标识避免同秒碰撞。
ADB无输出时不再对null调用Trim；保留明确的设备未就绪错误。未修改游戏、APK或系统配置。
实际验证：PowerShell语法解析通过；未传Stage立即拒绝；无emulator-5580时明确拒绝，均未执行同步、构建或安装。没有可启动模拟器，因此同步→编译→安装→instrumentation端到端路径未执行，不报告原生通过。本轮无视觉变更或截图，APK仍Stage-69。
