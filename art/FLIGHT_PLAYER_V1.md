# Stage274 玩家飞船

2026-10-22，内置imagegen生成原创透明背景俯视飞船，无商业游戏素材。需求是单架机头向上的科幻战斗机，象牙白装甲、石墨机械结构、蓝色驾驶舱、青色喷口和组件挂点，不含文字或品牌。

原始图 `art/source/flight-player-v1.png`，1254×1254 RGBA；`tools/export-flight-player.mjs`仅缩放至512×512并保留透明通道。运行图 `public/assets/flight-player-v1.png`。具体SHA与字节数据在构建时的 `build/art/flight-player-v1.json`。素材候选已接入实际Canvas；不把生成结果或技术导出当作用户最终美术批准。

三系科技/组件图继续使用本项目已有原创 `tech-icons-v1.png`、`mounted-modules-v1.png`；敌机、场景、爆炸也沿用项目原创资产。无外部商业游戏素材下载。
