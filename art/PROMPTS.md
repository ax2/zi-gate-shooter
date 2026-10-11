# 内置imagegen制作提示词规格

2026-10-11，使用内置image_gen，没有使用API密钥或外部CLI。原始文件ID见ASSET_REGISTER。

## 战斗候选

原创9:16无尽数字门射击完整战斗画面；精细2.5D俯视机械美术、石墨工业跑道；白蓝机甲底部80%位置向上开火，橙黑无人机在上方。T2机械箱显示HP32，双青色机械门显示“火力+20%”“火力+15%”，不透明大数字与进度条。局部暖色分层爆炸不遮挡数字或红色危险箭头。紧凑HUD为001240、3盾、暂停、T2双管、+20%；底部左右拖动自动开火。统一左上光、细节接缝和阴影，无几何占位、商业形象、广告/登录/购买。

## 实体图集

透明RGBA，1536×1024，严格4列2行，每格完整居中留15%空白，无文字/格线/地面。近正交俯视与左上光，精细金属材质。第一行：朝上白蓝单管地面机甲、同机体双管、同机体四管、朝下橙黑翼状无人机。第二行：朝下红黑冲锋机器人、赭黄履带装甲车、橙色精英机甲、宽翼双炮中央红机芯重装首领。对象不跨格、不采用商业形象。

## 道具图集

透明RGBA，1536×1024，严格3列2行，无文字数字、地面或不透明背景。第一行：完整白赭黄装备箱、同箱裂损态、银蓝双管掉落模块。第二行：青光机械门框、金光门框、局部橙色分层火球爆炸。门中央透明，供原生文字；所有对象完整居中留白、统一机械材质与左上光。

## 跑道

空环境9:16工业科幻跑道；近正交俯视、上下尺度一致，无消失点。中心83%低对比石墨水泥/金属面，细小接缝、铆钉、污损；两侧窄管道、电缆、机械和琥珀灯，保证弹道与文字清楚。上下边缘匹配以循环。无角色、敌人、弹丸、爆炸、箱、门、UI、文字数字、商标、强暗角或亮雾。

## Stage-02 Android启动资产（内置imagegen）

参考图art/source/units.png仅用于角色与材质，输出source/launcher-mech-v1.png；透明背景。实际最终提示词：

Create one original premium mobile game Android launcher foreground artwork. The attached existing sprite sheet is STYLE AND CHARACTER REFERENCE ONLY: use the ivory ceramic armor, graphite engineering and bright cyan reactor of the third white triple-cannon mech in its top row. Do not reproduce the sheet. One isolated powerful compact sci-fi gun mech, three distinct long cannon barrels pointing upward/away, armored shoulders and cyan reactor at center, viewed at a dramatic near-top-down 3/4 angle. No humanoid face, no face-like helmet. Highly detailed, finely painted metal, crisp strong silhouette readable as a 48px app icon; ivory main shape with restrained cyan and warm brass highlights. Keep the COMPLETE subject including all barrels within the CENTRAL 56% of a square 1024 canvas, centered (about 570x570), with abundant clear TRANSPARENT padding all around for Android adaptive masking. Do not add a square tile, border, rounded corner, ground, background, shadow outside the object, particles, typography, numbers, logos, watermark, extra objects, explosions or muzzle fire. Genuine transparent alpha background. A cohesive polished game asset, not generic glowing geometry and not a commercial game character.

生成结果实际1254×1254且主体未遵守56%留白要求；技术导出脚本重新等比缩放至安全圆，并以像素alpha范围核验，不冒称生成器严格遵守尺寸。
