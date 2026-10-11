# Stage-07 / 微信多指触控

日期：2026-10-11。延续可上架质量目标，平台仍为微信小游戏和独立Android APK。

## 目标与发现

当前源码b8554a7。共享CanvasRuntime.cancelTouch(id)已能忽略副指取消，但微信入口onTouchCancel丢弃事件并全量取消；副指被系统取消会中断主指拖动。现有实际bundle测试只调用无参数cancel，未覆盖该平台接线问题。

## 计划与验证边界

先为实际微信bundle增加多指取消负对照，再按changedTouches转发identifier；缺少触点的旧接口事件仍全量取消。验证通过后保存完整微信候选目录与构建哈希。此为VM环境的平台入口回归，不冒充微信工具/手机触控/手感验收。Android生产行为本阶段不变，不制造新的APK。

## 工作日志

- 已读取项目规则、README、策划、微信入口、共享输入实现、现有bundle测试和微信发布门槛。
- 原生Android模拟器前阶段明确终止，无待轮询进程；真机与发布门槛保持待验。
- 新增实际bundle输入夹具，只观察Canvas drawImage中的玩家位置，不暴露或修改World。先对旧bundle运行：5项入口测试中1项失败/4项通过；副指取消后主指位置371.333不再前进，失败断言保留于stage07-before.txt。
- 微信onTouchCancel改为按changedTouches.identifier转发，缺少/空changedTouches或无参数回调仍全量清理。共享核心、画面、素材和Android入口未改。
- `npm run build:wechat`类型检查与构建通过，537112字节；实际bundle测试5项加共享输入6项，共11项通过，280ms。覆盖主/副指取消、主指继续移动、旧触点无效、重新触摸可操作和3类缺失payload回退。未重跑全套规则测试；上次完整45项属于Stage-06。
- 官方onTouchCancel文档访问失败；官方typings GitHub页面可访问但Raw抓取失败。本阶段按已有Touch事件模型和真实bundle模拟验证，不把来源访问失败包装成微信API工具验证。
- 保存完整微信目录、清单哈希、负对照/正向原始输出与持续档案；本轮未改视觉，无新运行截图，不生成或重复打包Android。

## 遗留

微信工具/AppID、Android/iPhone真机、真人首次理解与长局、音画/品牌签收、正式签名与审核仍未完成。
