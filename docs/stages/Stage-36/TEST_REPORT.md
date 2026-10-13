# Stage-36 发布准备与原生环境复核（2026-10-13）

用户明确Android先提供独立APK，商店稍后确定；微信小游戏目标不变。已据此重写Android/微信发布入口文档，移除把Stage-06/18/24/32等历史路径反复称为“当前”的混淆，当前候选准确指向Stage-35。没有改玩法、素材或包内容，不重复打包。

## 环境实际结果

开始前无emulator/QEMU残留，adb无设备，emulator -accel-check报告WHPX可用。复用zi_gate_stage06_api35专用AVD，5580端口、2核/1536MB、无窗口/无音频/无快照、SwiftShader/Vulkan禁用冷启动；未改Windows虚拟化、安全或网络设置。

启动时间16:05:17，launcher PID57428、其子QEMU60932。观察窗口超过2分钟后adb仍offline，QEMU CPU累计约0.86秒，末尾只到WHPX operational。不能从此确定根因，也不能归为游戏故障。未安装APK、未执行NativeFlowTest、无Android运行截图。

按PID、父子关系、AVD名称和5580命令行检查本次所有权后停止。第一次立即读adb尚有offline条目；后续复核两进程均消失，adb列表为空。保留已有adb服务，无重复模拟器实例。

## 交付

复制Stage-35开发签名APK到本阶段Codex输出，附INSTALL.md和BUILD_RECORD.json，并核对SHA256。APK 7821741字节，SHA256 A548EE58CF1EB3A55AC6979824CF6D9363F73271DB230B02A833A903F56322B5。

本轮没有新的应用测试通过记录。沿用Stage-35的170项/构建核验；编译、签名、资源哈希不等于设备安装运行。用户暂无Android手机，不重复询问。不称正式发行或上架验收完成。

## 缺口

Android原生环境/真实安装与生命周期、双方设备性能与长局、微信AppID/工具/真机、真人体验/听审、正式品牌美术及发行签名、20分钟渲染耐久仍待完成。商店提交暂后置，其他质量要求不降低。外部环境阻断不构成完成依据。
