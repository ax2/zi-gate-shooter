# Stage-182 验证记录

2026-10-17，基线96d0268。范围为首领/契约升级对比，整体内容、画面和体验目标继续。

## 实现与边界
原首领已有分段机体爆炸/2.2秒揭示，本轮保留。旧升级卡只写升阶和基础系数，现复用详细武器机械图与六卡布局，显示下一阶/精校后的同武器全弹直伤、关键几何或射速变化、新配方提示。新equipmentPreview纯读，使用战斗同builtWeapon与常驻火力；配方复用recipeStatus只读前置视图，不复制条件、不创建World副本或消费奖励。recipeStatus只收窄TypeScript只读接口，规则不变。

数据为全弹直击速率，排除超载、命中率和派生；保留霰射弹数增加但发射变慢等真实取舍，不能作为不同武器完整火力排名。预览显示的模型是下一阶，精校保留T3图，不伪造新模型。未改任何伤害/冷却/碰撞/奖励/爆炸/揭示时序或存档结构。

## 自动检查
最终17文件123项通过（checks.txt）：equipment-preview、boss-loot、recipe-goal、native-flow、contracts、hunter-contract、build-preview、weapon-choices/roles/dossier、boss、equipment-research、support-weapons、rules，及boss-loot/contracts-progression/contracts-combat。最终补齐契约数值假设说明后4文件44项复验（final-checks.txt）与类型/build通过。不是完整全项目/平台验收。

新增28项：五武器T1/T2/T3与T3多次精校，投影与实际首领击破后领取得到的profile逐项一致，其他配件/等级/精校保留，重复领取拒绝；未持有武器无预览、两个同时新组合与电光连锁的真实前置、已有组合不重复显示、霰射5→7/5→4、反复读取不推进、不含临时超载。此类受控World/测试弹用于规则隔离，不冒充正常游玩。组合提示的特殊条件以这些受控检查证明，未声称正常GUI已覆盖所有新组合卡。

扩大回归发现weapon-choices开场检查仍要求旧flank，而当前HEAD已采用rebound；director/behavior本轮diff为空，确认不是新游戏回归。只将断言更新为折返且真实横向目标，不删开场威胁检查；initial-checks.txt保留失败。另误定位weapon-roles的替换被脚本断言拒绝，未修改该文件，该独立2项检查通过。

normal-loot.json：两种正常600秒策略（蓝图/装备）均HP3/R8，7次真实首领击破/7次领取，分别7蓝图或7装备，无世界装备/生命注入；原契约正常流程也通过。自动全局操作者不代表真人体验。

最终npm run build含tsc --noEmit通过，91模块，canvas-preview-BXTSA_0v.js。46构建资源与Stage-182逐项SHA256一致（frozen-resources.json），另含serve.mjs配置5264，本轮未另启，不打ZIP。无微信/Android工作。

## 实际浏览器
使用生产CanvasRuntime、原DOM按钮/触控、虚拟时钟与隔离内存Save；电弧首箱初始偏好，全部升级/首领/契约正常获得，无World注入。

390×844：首轮81.22秒五卡（reward1-phone），与旧baseline-phone对照，旧/新current的18个公共字段逐一相同（含世界时间、得分、装备/伤害、能量/点数/领取账本）。实际领取电弧T2→T3，旧武器保留、设备领取1次（claim-arc）。第二轮162.57秒五武器/六卡，展示T3精校真实增益与霰射射速变化（reward2-phone），弱档current完全相同（reward2-weak-phone与对应JSON）；实际领取蓝图后技能点+1，首领总领取2、蓝图1、装备1（claim-research）。

1280×900：第三轮246.72秒弱档完整六卡（reward3-weak-desktop），DOM实测body1280×900，卡片/底部说明清楚（reward3.json）。第一次拟桌面捕获仍390×844：多标签时浏览器viewport覆盖作用当前标签，发现后按手机弱档重命名，关闭另一临时标签后重新设置并实测桌面，不将窄图冒充桌面。

契约：13.28秒正常拾取T2/选择导电线圈后，原菜单接危险猎手分批悬赏，27.30秒真实全破/契约奖励（contract-phone/json）。卡片充能30→80/突破1次，实际选择+150后能量80、领取1、技能点多1，三武器等级/精校保留（contract-claimed）。契约底部补全全弹命中/不含超载派生说明后，重放同27.30页面确认（contract-final-phone）。所有相关浏览器error/warn为空。临时标签/5255关闭，视口恢复。

正式5178菜单与最终脚本/HTTP确认见工作日志。用户未进行视觉签收；静态清晰度和自动流程不证明真人选择满意度、长期趣味或低端性能。
