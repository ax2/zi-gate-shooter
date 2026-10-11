# Stage-08验证记录

日期2026-10-11，范围为微信音频故障边界与恢复。

| 检查 | 实际证据 | 结论 |
|---|---|---|
| 旧bundle负对照 | 9项中4失败/5通过；创建/配置/play故障出现游戏错误页，stop故障从hide抛出 | 已复现 |
| 最终相关回归 | `npx vitest run tests/wechat-runtime.test.mjs tests/input-release.test.ts`，2文件16项通过，362ms | 通过 |
| 类型/微信构建 | `npm run build:wechat`，537403字节 | 通过 |
| 完整规则测试 | 本阶段未执行；Stage-06历史45项不能冒充本阶段结果 | 不扩大结论 |
| 音效/真机系统打断 | 未执行 | 待验 |
| Android/视觉 | 未改生产代码，沿用Stage-06 APK，无新截图 | 不重复验收 |

测试运行实际微信bundle，平台wx/Date/Canvas为VM模拟，不提供document/window。绘图文字用于确认战斗或暂停而非错误页，节点计数用于检查清理与重试；没有修改游戏World、生命、奖励或坐标。

覆盖创建/配置/play抛出、stop抛出、异步onError、stop与destroy同时抛出、5秒后恢复、旧节点迟到onError与多指/输入回归。故障后半秒仅一次创建尝试，恢复正常factory后重新play；5秒为候选工程退避值，需要设备验证，不是音效听审通过。

微信仍需开发者工具/AppID、Android/iPhone真机、系统音频焦点、后台恢复、资源/内存与长局检查。三阶音效可辨识性、爆炸层次、音量与真人体验尚未签收，不能用静音容错满足这些门槛。
