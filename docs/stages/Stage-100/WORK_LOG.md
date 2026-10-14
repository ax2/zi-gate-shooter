# Stage-100 当前可玩版本交付（进行中）
以当前dist生成独立静态试玩目录，保留文件哈希与源码版本；正式玩家入口，不包含自动操作者。整合验证和实际交互后更新总览，平台发布仍排除。

## 交付目录与操作
- build/playable/Stage-100：当前Vite dist独立副本、serve.mjs、本地启动说明、LICENSE、manifest.json。使用Node执行node serve.mjs即可在127.0.0.1:5190试玩，无npm install、无HMR、无自动操作者。
- 46个交付文件SHA256逐一核对，0不一致。静态服务仅本机监听，拒绝越界路径及非GET/HEAD。没有ZIP、Android或微信发布动作。
- docs/stages/Stage-100另保留启动脚本、PLAY.md和manifest便于追踪；静态可运行目录保留在build/playable。

## 验证
- npm run build类型检查与网页构建成功（184ms）。
- npx vitest run --exclude tests/android-licenses.test.mjs --exclude tests/build-output.test.mjs --exclude tests/wechat-runtime.test.mjs：34文件249项通过（74.62秒），含近期加载、暂停预览、resize、帧诊断和原有规则长局。
- 390×844实际静态入口菜单、开局击杀、暂停、返回菜单操作通过，截图保存。不是预置战斗或自动奖励。
- Stage-99同源码生产运行时+测试操作者的静态20分钟已完成；本Stage玩家包只做短交互检查，不将夹具20分钟称为真人试玩。

## 当前内容与限制
5武器×3阶、6敌种、3章节首领、9战斗组合已进入正常流程；原创机体、弹道、爆炸、残骸、提示、超载和暂停恢复等有实际表现和阶段证据。没有新增登录、付费、广告、后台或基地。
用户尚未试玩、要求先继续整体验证；数值/真人平衡和主观爽感仍未最终签收。历史开发环境偶发长回调根因未确定，静态20分钟通过不证明所有环境无卡顿。平台相关工作继续排除。
