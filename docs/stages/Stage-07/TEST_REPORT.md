# Stage-07验证记录

日期：2026-10-11。范围为微信多指取消接线修复。

| 检查 | 证据 | 结果 |
|---|---|---|
| 旧包负对照 | 实际build/wechat/game.js在VM中启动，副指cancel后主指x停在371.333；5项中1失败/4通过 | 已复现 |
| 修复后回归 | `npx vitest run tests/wechat-runtime.test.mjs tests/input-release.test.ts` | 2文件11项通过，280ms |
| 类型/构建 | `npm run build:wechat` | 通过，537112字节 |
| 全套规则 | 本阶段未执行；上次Stage-06完整45项通过 | 不扩大结论 |
| 微信工具/真机 | 未执行 | 待验 |
| Android/视觉 | 无生产修改，沿用Stage-06 APK/画面 | 不制造新验收证据 |

新增5项入口测试中的4项覆盖取消边界，原烟雾测试保留。副指取消应让主指继续向目标移动；主指取消应停在实际位置并忽略旧移动，重新按下才可移动。空changedTouches、缺失changedTouches和旧式无参数回调都清除残留拖动。

测试执行实际微信bundle，不提供document/window；平台wx和绘图上下文为VM模拟，玩家位置从真实渲染drawImage参数只读观察。没有注入血量、奖励、坐标或替换游戏规则。它证明入口接线回归，不能证明手机系统手势、触控延迟、微信音频或长局性能。

本阶段无视觉修改及新运行截图。源码、候选完整目录、BUILD_MANIFEST与原始测试日志保留；不新建ZIP。Android真机/低端性能、微信工具/AppID、视觉/音频/品牌、3名新玩家体验和正式发布仍未完成。

参考入口（访问结果见日志）：https://developers.weixin.qq.com/minigame/dev/api/device/touch-event/wx.onTouchCancel.html ，https://github.com/wechat-miniprogram/minigame-api-typings 。
