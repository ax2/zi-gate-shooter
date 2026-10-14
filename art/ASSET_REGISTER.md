# 原创素材登记

## Stage-15 装备箱三态与六片甲板候选

2026-10-11，内置imagegen参照既有原创props，三轮源/提示词/技术导出均保留，返修2明确拒用。当前source/crate-atlas-v3.png→public/assets/crate-v1.png（768方形RGBA，534538字节、解码2.25MiB），详细来源/尺寸/alpha局限见CRATE_V1.md。未获人工美术/版权正式签收。

## Stage-12 原创循环配乐候选

2026-10-11，tools/generate-music.mjs原创确定性编曲与合成，未用外部音乐/采样/模型或商业游戏音频。public/assets/audio/mechanical-pulse-v1.wav为120BPM、8小节16秒、22050Hz单声道PCM16，705644字节；代码/素材随本项目MIT开放。鼓、低音、合成器分层后统一输出一条轨；原7音效不变。完整来源/测量见art/MUSIC_V1.md。候选未听审，不声称风格/混音/扬声器效果达标。

2026-10-11。全部通过本会话内置imagegen生成，无商业游戏素材。候选图未获用户最终批准。提示词规格见PROMPTS.md。

| 文件 | 来源/用途 |
|---|---|
| concepts/combat-direction-v1.png | 战斗候选；exec-cdb5a7e5-bb41-47eb-a600-4ba5e969c403.png |
| source/units.png | 8实体4×2透明原图1536×1024；exec-29f68a7e-a2c6-49af-8000-d74e26db2543.png |
| source/props.png | 6道具3×2透明原图1536×1024；exec-b894863a-26c0-4cab-970e-217dece88f06.png |
| source/runway.png | 地表原图；exec-84347687-1d7d-4fab-9d12-09cb0fba3570.png |
| ../public/assets/units.png / props.png | 768×512、256色运行PNG，保留alpha |
| ../public/assets/runway.jpg | 720宽JPEG运行导出，高清源保留 |
| ../public/assets/audio/*.wav | tools/generate-audio.mjs合成13个原创音效，Stage-32新增三阶霰射/穿甲共6个短音；音乐另行登记 |

角色与道具原图角落透明度检查为0。等分格读取，文字、耐久、危险与奖励由程序绘制。使用设备系统字体，无外部字体文件。循环纹理接缝仍需动态专项验收。

自有代码与文档MIT；生成素材随项目开放，不声称商标/角色独占或作未经核查的第三方权利保证。不得引入未授权商业游戏角色或音频。

## Stage-10 爆炸动画候选

2026-10-11，内置imagegen原创生成，未使用商业素材或参考图。原图 source/explosion-atlas-v1.png（1280×1280 RGBA，1308115字节）；运行图 ../public/assets/explosion-v1.png（768×768，149698字节，3×3九帧）。每帧256×256，RGBA解码2359296字节（2.25MiB），与PNG体积不同。tools/export-fx.mjs保留透明通道，只做技术裁格/缩放/压缩；九格显著alpha均未触及3px边界，原图未替换。实际提示词与生成来源见explosion-v1-prompt.md，素材随本项目MIT开放，仍为未签收候选。

## Stage-02启动资产候选

2026-10-11。source/launcher-mech-v1.png来自本会话内置imagegen，生成文件exec-d4ccdf7f-da04-4e47-983c-8b419a05d00a.png（1254×1254透明RGBA）；以既有units.png为角色/材质参考，生成单体三管白色机甲，无文字或商业形象。尚未用户签收。

tools/export-launcher.mjs保留源图，完成技术裁空、等比缩放和Android密度/遮罩导出；五档adaptive前景108–432px、legacy48–192px、启动标记576px和512px无圆角候选图。显著alpha(>32)范围均在33dp半径内，具体记录art/exports/launcher-export.json。单色图标由系统使用同一前景alpha着色，不额外绘制虚假轮廓。

art/exports/launcher-preview.html仅为资产适配说明，非原生截图。原始模板启动PNG和未引用模板XML从当前资源中移除，可从d6002e7历史恢复；本机运行和系统启动过渡尚待真机。素材随项目MIT开放，品牌与名称仍为候选。

## Stage-19普通敌人动作源（拒用）

source/enemies-atlas-v1.png、v2.png均为本会话内置imagegen生成，以本项目原创units为来源链；完整提示词与来源见ENEMY_CANDIDATES.md。两版均1254×1254 RGBA，哈希见阶段SOURCE_INSPECTION.json；跨格/尺度/边缘不合格，未导出或接入运行资产。随项目MIT开放，非批准角色/动作素材。

## Stage-20无人机三姿态候选

source/drone-strip-v1.png为本会话内置imagegen、原units参考，来源/完整提示词/源哈希/拒用源前史见DRONE_V1.md。运行图../public/assets/drone-v1.png为768×256/145507字节，全RGBA解码786432字节；源图/导出信息见docs/stages/Stage-20/ASSET_EXPORT.json，重复导出一致。随项目MIT开放，非批准角色或商标；正式边缘和动态人评待验。

## Stage-21冲锋机三状态候选

source/charger-strip-v1.png由本会话内置imagegen、原units参考，2172×724 RGBA977896字节。运行../public/assets/charger-v1.png为768×256 RGBA158309字节/解码786432字节；源/运行哈希、共同裁框及来源提示词见CHARGER_V1.md和阶段ASSET_EXPORT.json。随项目MIT开放，非批准角色/商标；正式边缘、步态、动态人评与真机待验。

## Stage-22重甲候选

source/armor-strip-v1.png由本会话内置imagegen、原units参考生成，2172×724RGBA；运行armor-v1.png为768×256RGBA258416字节，解码786432字节。来源/实际提示词/裁框/哈希见ARMOR_V1.md及阶段ASSET_EXPORT.json；MIT开放，未批准正式美术/品牌，边缘、人评与设备待验。

## Stage-23精英候选

source/elite-strip-v1.png、v2.png为本会话内置imagegen、原units参考及首版修订；第二版1379085字节为运行来源，首版保留未接入。运行elite-v1.png为768×256 RGBA254549字节，解码786432字节；实际提示词/源哈希/裁框/限制见ELITE_V1.md及阶段报告。MIT开放，非批准角色/商标/正式美术。

## Stage-24首领候选

source/boss-strip-v1.png、v2.png来自本会话内置imagegen与原创units参考；首版触边拒用，第二版1328693字节为运行来源。运行boss-v1.png为768×256 RGBA306317字节/解码786432字节；提示词/源哈希/拒用数据/共同裁框/限制见BOSS_V1.md及阶段ASSET_EXPORT.json。MIT开放，非批准正式美术/品牌。

## Stage-28无人机残骸候选

source/drone-wreck-v1.png由本会话内置imagegen参考原创无人机生成；1254方RGBA，运行256方60608字节/解码262144字节。源/完整提示词/导出/哈希/候选限制见DRONE_WRECK_V1.md及阶段ASSET_EXPORT.json；MIT开放，非批准美术/品牌。

## Stage-29剩余敌种死亡候选

charger/armor/elite-wreck-v1.png分别由本会话内置imagegen参考原创机体生成，源1254方RGBA，运行各256方71421/81924/81684字节；新增解码0.75MiB。MIT开放，完整实际提示词/来源/哈希/限制见ENEMY_WRECKS_V1.md与enemy-wrecks-v1-prompts.md；非正式音画/品牌签收。

## Stage-41 冷却通道候选
内置imagegen生成，已有原创跑道作风格参考；完整提示词见cooling-corridor-v1-prompt.md。源图source/cooling-corridor-v1.png，运行图public/assets/cooling-corridor-v1.jpg，720×1279/184125字节。交替反射滚动，中央保持低对比；候选未最终签收。

## Stage-50 装甲通道
内置imagegen、自有跑道参考，完整提示词armored-corridor-v1-prompt.md。源图source/armored-corridor-v1.png，运行图public/assets/armored-corridor-v1.jpg，149057字节；第三章交替反射滚动，候选未签收。
Stage-63：霰射机体source/scatter-player-v1.png由内置imagegen参考自有units生成，完整提示词scatter-player-v1-prompt.md。export-scatter-player.mjs透明技术导出到public/assets/scatter-player-v1.png，576×256/169813字节；候选非最终美术签收。
Stage-64：穿甲三阶原创候选由内置imagegen参考自有units生成。v1炮口裁切拒用保留，v2源图source/pierce-player-v2.png完整；提示词pierce-player-v1-prompt.md和pierce-player-v2-prompt.md。未接入，非最终美术。
Stage-65：pierce-player-v2源图经export-pierce-player.mjs裁格与保持比例导出public/assets/pierce-player-v2.png，576×256/159696字节，候选已接入，最终美术待验。

Stage-81：boss-flanker-v1，内置imagegen参考自有boss-strip-v2生成。source/boss-flanker-v1.png为2172×724透明源图，export-boss-flanker.mjs导出public/assets/boss-flanker-v1.png（768×256/249823字节），原图和提示词保留。第二章巡航/准备/残骸共用，不代表最终美术签收。


Stage-83：boss-bastion-v1由内置imagegen原创生成，prompt见boss-bastion-v1-prompt.md，source/boss-bastion-v1.png源图2172×724透明；export-boss-bastion.mjs导出768×256/245556字节。第三章巡航/准备/破损候选，未最终美术签收。

Stage-84：sniper-v1原创三态，内置imagegen，source/sniper-v1.png与sniper-v1-prompt.md保留；export-sniper.mjs导出768×256/195933字节及256×256残骸。狙击哨机候选未最终签收。
