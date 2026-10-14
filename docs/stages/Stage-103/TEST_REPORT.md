# Stage-103 武器档案与选择提示

## 已实现
主界面新增武器档案，五个可点击页签展示现有原创三阶机体、用途与取舍。仅提供信息，没有局外装备或解锁；退出和开始游戏仍使用正常T1速射炮。霰射箱与换装提示更新为近距聚弹/留意碰撞，与Stage-102候选平衡一致。

## 实际验证
- npm run build：类型检查与网页构建通过（161ms）；新增测试后npm run typecheck再次通过。
- 第一组实际匹配5文件26项通过：weapon-dossier、native-flow、context-guide、weapon-choices、asset-load；命令中input.test.ts与pause-preview.test.ts不存在，未计入覆盖。
- 补充keyboard-input、input-release、weapon-motion，3文件23项通过。合计8文件49项，不称为完整251项回归。
- 新行为测试验证五个页签、显示用途/弱点、时间不推进、World引用/装备不变、原生返回、屏幕返回和正常开始。
- IAB开发入口390×844：霰射、电弧档案文本无截断，T1/T2/T3机体可辨。1280×720稳定截图检查通过。调整视口后首次截图捕获过渡空白，保留arc-desktop.png，不作为通过；稳定帧arc-desktop-stable.png为桌面证据。
- 独立静态包5193：主界面→武器档案→返回→开始→实际击杀得10分→暂停→返回通过；浏览器采集日志无error/warn。Canvas无DOM文本，非空与操作结果使用实际截图核对。

## 交付和边界
build/playable/Stage-103含固定dist、Node启动脚本、LICENSE、逐文件哈希清单。启动node serve.mjs，访问127.0.0.1:5193。保留旧版，未重复生成Android或微信包。
未改战斗规则、素材或特效数量；没有重新执行20分钟渲染或真人试玩。新增档案改善学习与比较入口，不把说明页当新武器/新关卡。既有内容的真人爽感与重复度仍未确认。
