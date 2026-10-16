# 机械数字门 · 原创候选 v1

2026-10-16，Stage-169。使用会话内置image_gen工具直接生成，transparent_background=true；未使用商业游戏素材或外部素材下载。完整实际提示词见gate-frame-v1-prompt.md。生成标识exec-2ade6464-d5b9-4f7d-b25f-4f8edc966010，原始PNG复制为source/gate-frame-v1.png，不覆盖原props图。

原图1659×948 RGBA，1,238,680字节，SHA256 db76dd26b5ae971d3a9cba6a21e4673c69818934218bb4e83cf10a5a4b1b7293。金属/陶瓷装甲、活塞/铜线圈/散热鳍片、侧发光槽，中央和外围实际alpha透明。源中央458490个采样像素全部alpha≤1，外围保留安全留白。

技术导出tools/export-gate-frame.mjs：按alpha非空包络加8源像素留白裁切（13,46,1630,837），等比缩至640×329，再PNG无损压缩；没有重绘、生成后颜色替换或抠图。public/assets/gate-frame-v1.png为262016字节，解码842240字节，SHA256 fc500aef964c5270fd09241e29316e8cda0c161d79c09b5639e3faaf81438e22。可运行npm run assets:gate重现，原始/导出sha与alpha证据见docs/stages/Stage-169/asset-check.json。

运行时用八片边框保留边角与透明中央，单行/混合奖励自适应；双门缩窄柱体与面板，实际间隙保留。程序绘制数字/八格总蓄能槽与当前档进度条，命中/真实升档的局部导管亮度、最大1.7逻辑像素机械位移（弱档0.6），不扩大碰撞。门框先于敌人，奖励底板与敌人显示区域重叠则省略，敌弹仍在数字之上。

本候选已做实际运行手机/桌面、标准/弱档局部检查，并非用户正式美术签收、版权法律审查或低端设备验收；不宣称全场景质量完成。实际画面/交互/局限详见Stage-169/TEST_REPORT.md。旧箱体已有原创三态与碎片，本轮保留，不将其重复计为新素材。
