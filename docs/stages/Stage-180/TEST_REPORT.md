# Stage-180 验证记录

2026-10-17，基线44f0304。目标是增加组合成立后的构筑取舍；整体内容、画面与体验目标继续。

## 规则与自动流程
最终15文件97项通过（checks.txt）：photon-refinement、photon-progression、laser-chain、build-preview、magnetic-refinement、build-tree、run-report、native-controls、native-flow、optical-feedback、rules、optical-pulse、laser-chain-progression、support-weapons、support-audio。新增7项受控规则与1项两方向正常成长；控制目标/注入测试弹只用于规则隔离，不冒充正常游玩。

覆盖实际组合前置/点数/错误路线/重选失败不突变、新局无精研、全部武器与等级保留、普通精调增伤/后续继续、预览只读、战绩名称；第三跳非递归/不重打、300/301边界、闭盾与入场保护阻止绕过、箱门不充能、孤立真实HP差异、首领聚能击破停止后续伤害。原有保护/原直击及所有武器触发释放回归通过。

normal.json：从首轮、电弧首箱、种子1337正常获得装备/技能/首领奖励，无生命/装备/世界状态注入。两方向114.90秒通过5点中第5点取得精研，均完整600秒/HP3/R8。远链42光链命中、精研后4次三跳/47次聚能；聚焦28光链命中、精研后56聚能、最多两跳。峰值目标9/子弹67。自动全局可知操作者不代表真人难度，不能凭HP3认定易或难。

初始失败保留initial-checks.txt：受控拾取位置错误导致前置未成；另用例高突破引发既有6点折射干扰隔离断言，修正测试状态，没有削减生产伤害。具体锁定雷暴建议曾被通用提示替代，恢复原“先选导电线圈”后最终97项通过。执行脚本一度用系统GBK读UTF8失败，后显式UTF8，不是游戏运行错误。

npm run build（含tsc --noEmit）通过，88模块，最终canvas-preview-C6dy8gm-.js。冻结46资源逐项SHA256一致（frozen-resources.json），serve.mjs配置5262、本轮未另启；无ZIP，无微信/Android工作。

## 实际渲染与输入
测试页tools/visual-fixtures/photon-refinement.html使用生产CanvasRuntime、正常DOM按钮/触控与正常成长；虚拟时钟、隔离内存Save、电弧首箱初始偏好，无World注入。先前镜组素材与光链真实特效复用，未增加素材来源。

390×844手机：114.90秒正常到达精研，choice-phone.png两张卡清楚，含作用、精确参数、激光直伤83.5→91.1和花费/不可改选说明。before-choice/cancel/reach-chosen.json：取消仍花费4、确认后5，时间相同、四种武器T1/T2/T2/T3完整保留。127.62秒reach-phone.png实战产生3条光链弧，arcs3未超原12预算（reach.json），原中继停火与已发敌弹提示存在。parameters-phone显示3跳/300/80%，tree-phone显示远链矩阵，文字均检查可读。

1280×900桌面：正常重放同114.90秒选择聚焦（choice-desktop.png），115.43秒实际增强聚能（focus-weak-desktop.png）。focus-standard/weak.json中current完全一致，弱档实际聚能保留；focus-parameters-desktop.png显示2跳/220/140%，暂停未推进时间。以上为查看自动流程截图，不是用户视觉签收。

5178正式浏览器六个菜单控件可见、live-menu.png；读取脚本C6dy8gm-，主页/脚本直连HTTP200，正式与测试标签error/warn均空。临时5255服务/测试标签关闭，原5178服务保留。

## 限制
范围/倍率为候选。未做真人十分钟或长期重复体验、低端设备帧率，也未证明两精研价值平衡；不以通过测试或增加一组选项宣称目标完成。没有新增敌人、关卡、成就或独立视觉素材；复用原弧池上限12、非递归/保护/首领结束规则，奖励守恒与升级叠加保持。
