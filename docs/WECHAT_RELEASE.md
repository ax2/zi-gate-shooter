# 微信小游戏发布准备与验收

Stage-14最新候选：build/wechat，manifest除外1397609字节。三阶玩家分层动作，89项完整测试含实际bundle触控观察通过；未微信工具/AppID/真机/提交，见stages/Stage-14/TEST_REPORT.md。

Stage-13历史候选：build/wechat，manifest以外1396551字节。实体受击反馈共享入口，84项回归通过；微信合成支持/工具/AppID/真机待验，见stages/Stage-13/TEST_REPORT.md。

Stage-12历史候选：build/wechat，manifest除外1395921字节。原创循环配乐、独立开关与节点失败清理，完整82项含实际bundle测试通过；未微信工具/AppID/真机/提交，见stages/Stage-12/TEST_REPORT.md。

Stage-11历史候选：build/wechat，manifest除外688849字节。首领局部连续爆炸/分片消散共用Canvas入口；最终类型/构建与相关回归通过，微信工具/AppID/真机/提交审核未完成。范围见stages/Stage-11/TEST_REPORT.md。

Stage-10历史候选：manifest以外687174字节，包含原创九帧爆炸图集。完整67项测试含实际bundle入口回归；未使用微信工具/AppID真机验证，未提交审核。截图中的移动网页和刻意渲染夹具不能作为微信真机验收，详见stages/Stage-10/TEST_REPORT.md。

2026-10-11，用户已明确最终平台为微信小游戏，并追加独立Android APK。浏览器入口用于开发验证，Android与微信独立构建、分别验收。

## 平台策略

共享src/core纯规则；微信入口使用wx.createCanvas、wx.createImage、触控、前后台生命周期、本地存储和本地音频，不依赖DOM HUD、浏览器AudioContext、登录或后台。构建产物保留为完整目录，不生成ZIP。

浏览器canvas.html与微信共用原生Canvas渲染器，用于快速交互与视觉验证；根页面保留早期Phaser验证入口。微信入口仍必须在开发者工具和真机单独核验，不能把浏览器截图称为微信截图。

## 官方依据

- [微信官方小游戏示例](https://github.com/wechat-miniprogram/minigame-demo)：示例入口game.js/game.json及官方API使用。
- [wx.createCanvas官方文档](https://developers.weixin.qq.com/minigame/dev/api/render/canvas/wx.createCanvas.html)。文档可访问性与实际工具验证分开记录。

## 上架质量退出条件

1. 开发者工具导入实际构建目录，正确AppID，模拟器无运行异常，按钮/触控/暂停/音频/重开均通过。
2. 至少一台目标Android与一台iPhone真机验证，记录系统、微信版本、分辨率、画质、帧时间、发热、20分钟长局与20次重开。没有设备不勾选。
3. 首次启动、加载失败、断网（纯本地资源）、前后台切换、低内存恢复、系统音频打断、刘海/胶囊安全区检查通过。
4. 三阶火力和两类成长目标具有正式视觉/声音；数字与危险在强火力场景仍可读；至少3名新玩家试玩记录。
5. 包体与资源清单检查，源码许可、生成素材来源、字体许可、无商业游戏资产；具体平台大小限制以开发者工具当期校验为准。
6. 正式名称、图标、介绍、截图、主体/类目/平台要求、隐私披露等按账号后台实际要求准备并核实。公开源码不代表平台审核通过。
7. 用户确认发布材料后再提交审核；审核状态和线上验证需真实结果。

当前上述微信运行/真机/审核条件均未完成。AppID、目标设备与账号后台要求尚未取得；先完成可导入的本地包和其他可独立验证工作，再集中处理实际缺口，不索取私钥或账号密码。

Stage-07：onTouchCancel按changedTouches中的identifier转发，副指不会清空主指拖动；空/缺失事件仍清理。实际bundle负对照与修复后5项入口回归、6项共享输入回归通过；构建537112字节。此为VM事件模拟，未验证真实系统三指/截图/电话手势。文档入口本轮访问失败，不据此宣称已在微信工具执行。

Stage-08：音频API异常在平台适配器中隔离，失效池清理并候选5秒退避；stop/destroy异常不打断暂停，旧节点迟到错误不清新池。创建/配置/播放/停止的旧包负对照均失败，修复后16项相关回归通过，微信候选537403字节。只证明VM故障注入，不证明声音质量、真实音频焦点、电话/系统打断或资源在设备上已释放。
