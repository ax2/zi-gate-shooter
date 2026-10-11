# 原创素材登记 · Stage-01

2026-10-11。全部通过本会话内置imagegen生成，无商业游戏素材。候选图未获用户最终批准。提示词规格见PROMPTS.md。

| 文件 | 来源/用途 |
|---|---|
| concepts/combat-direction-v1.png | 战斗候选；exec-cdb5a7e5-bb41-47eb-a600-4ba5e969c403.png |
| source/units.png | 8实体4×2透明原图1536×1024；exec-29f68a7e-a2c6-49af-8000-d74e26db2543.png |
| source/props.png | 6道具3×2透明原图1536×1024；exec-b894863a-26c0-4cab-970e-217dece88f06.png |
| source/runway.png | 地表原图；exec-84347687-1d7d-4fab-9d12-09cb0fba3570.png |
| ../public/assets/units.png / props.png | 768×512、256色运行PNG，保留alpha |
| ../public/assets/runway.jpg | 720宽JPEG运行导出，高清源保留 |
| ../public/assets/audio/*.wav | tools/generate-audio.mjs合成7个原创音效 |

角色与道具原图角落透明度检查为0。等分格读取，文字、耐久、危险与奖励由程序绘制。使用设备系统字体，无外部字体文件。循环纹理接缝仍需动态专项验收。

自有代码与文档MIT；生成素材随项目开放，不声称商标/角色独占或作未经核查的第三方权利保证。不得引入未授权商业游戏角色或音频。

## Stage-02启动资产候选

2026-10-11。source/launcher-mech-v1.png来自本会话内置imagegen，生成文件exec-d4ccdf7f-da04-4e47-983c-8b419a05d00a.png（1254×1254透明RGBA）；以既有units.png为角色/材质参考，生成单体三管白色机甲，无文字或商业形象。尚未用户签收。

tools/export-launcher.mjs保留源图，完成技术裁空、等比缩放和Android密度/遮罩导出；五档adaptive前景108–432px、legacy48–192px、启动标记576px和512px无圆角候选图。显著alpha(>32)范围均在33dp半径内，具体记录art/exports/launcher-export.json。单色图标由系统使用同一前景alpha着色，不额外绘制虚假轮廓。

art/exports/launcher-preview.html仅为资产适配说明，非原生截图。原始模板启动PNG和未引用模板XML从当前资源中移除，可从d6002e7历史恢复；本机运行和系统启动过渡尚待真机。素材随项目MIT开放，品牌与名称仍为候选。
