# Stage-09验证记录

日期2026-10-11。范围为Android/浏览器Web Audio故障隔离及恢复。

| 检查 | 证据 | 结果 |
|---|---|---|
| 旧实现负对照 | audio-faults 10项失败 | 已复现 |
| 最终完整测试 | npm test，11文件64项，97.20秒 | 通过 |
| 类型/网页构建 | npm run build | 通过，早期Phaser大chunk警告保留 |
| Android | 构建50秒，4993396字节；签名/资源/图像/许可/权限 | 通过构建核验，未原生运行 |
| 微信 | 537403字节，实际bundle回归含于完整套件 | 未工具/真机验收 |
| 网页故障对照 | 旧bundle首帧error；新bundle同故障9.8秒仍playing并可暂停 | 通过指定模拟条件 |
| 正常网页产物 | 身份正确、非空、无框架错误遮罩、桌面/移动战斗与暂停；console error/warn为空 | 通过 |
| 原生/听感/性能 | 无手机、无听审、无设备长局证据 | 未验收 |

APK SHA256：`EF7E9F89FFBD819C7956CC6D53F3F9484A62B379A1EC5C09229F26B85CFBB4DF`，debug签名。原生两项Instrumentation测试仍仅编译，不能用本阶段64项模型/VM测试替代。

新测试覆盖oscillator/gain/连接/start/stop失败不打断真实CanvasRuntime，主动断开两节点、迟到ended幂等、退避后恢复、context创建/resume失败和closed重建时首发音效时钟。5000ms为候选退避值；物理音频资源释放/音色/音量/系统焦点未证实。

网页使用CUA IAB，实际产物URL为127.0.0.1:5178/build/android-web/index.html，桌面1280×720、移动PNG390×843。普通局12.35秒/10分/3HP，手动暂停12.416667秒；故障夹具9.8秒/10分/3HP仍战斗，暂停9.866667秒。未注入游戏奖励或生命。

旧/新夹具只替换AudioContext工厂，不能当Android原生截图；实际产物另开新tab无故障注入。浏览器高刷新帧样本不是手机性能验收。截图与JSON已归档，QA页关闭且视口复原。音效/品牌/微信工具/真机/真人试玩/发布仍未完成。
