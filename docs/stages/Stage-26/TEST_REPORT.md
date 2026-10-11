# Stage-26 / 候选包可复现性验证

| 检查 | 实际结果与边界 |
|---|---|
| 旧版负对照 | 使用提交90c6f4d的两份真实构建脚本，在隔离小项目中连续构建；删除源retired.txt后微信/Android输出仍保留。baseline-result.json记录source=false、两端shipped=true |
| 修订回归 | 3项通过/892ms，实际运行脚本两次；旧素材与外来文件不再输出，AppID/有效资源/Android许可保留，微信manifest只含预期文件；junction输出拒绝且外部文件保留 |
| 完整回归 | 24文件141项通过，99.48秒，含共享规则、无尽、渲染及微信bundle自动检查；不是设备实测 |
| 类型与网页 | npm run build通过，保留既有npm devdir及早期Phaser大chunk警告 |
| Android | sync及构建通过，Gradle42秒；开发debug APK7585619字节，SHA256 C13F5F049BE37784981FAC848904DCBDA56DA0F156D82DBB3B79303B3AFC0C19，与Stage-24一致；签名、23网页文件SHA、16原生RGBA、50+50许可和最终权限核验通过，app lint0错误5警告 |
| 微信 | manifest外3061599字节，与Stage-24大小一致；未执行开发者工具、AppID、微信设备或审核验证 |
| 原生运行 | Stage-25残留QEMU仍offline；未安装本轮APK，未运行两项instrumentation。暂无Android手机 |

本轮修复防止未来素材删除/改名时夹带旧文件；现有资源不变，所以APK哈希相同符合预期。生成目录为一次性输出，微信仅保留AppID字段；开发者工具的其他临时设置与私有配置应在生成目录以外管理。构建失败时不得把部分目录交付为候选。没有新增游戏截图或听审/性能数据，仍未达到正式发布退出条件。

本地原始命令输出位于build/qa/Stage-26，双端候选位于build/releases/Stage-26。测试使用小型隔离项目证明打包行为，不把夹具作为完整游戏运行证据。
