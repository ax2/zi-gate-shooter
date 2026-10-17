# Stage-193 实际渲染截图

手机390×844；有效桌面desktop-embers为1280×800。观测页有98px开发控制区，使用隔离内存存档/虚拟时钟/固定装饰随机，不改World，都是实际Canvas画面。preview-final另为正式入口。

mobile-hot/edge/embers与对应baseline是16.2667/16.3667/16.5500秒实际普通爆炸三阶段，完整World对照均相同；mobile-edge-weak为同刻弱档；desktop-embers为正常重绘后的桌面同刻余烬。短热芯、断裂边缘与实体碎屑可对照，火力/奖励标签可读。

mobile-current / mobile-baseline为16.1333秒初选非致命命中，blast=0，战场像素相同，不作爆炸验收；desktop-resize-initial-blank为resize即时截图的失败证据，下一次正常重绘截图有效。initial-mobile-late-hot / edge观测到既存爆炸但hot标签错误，只作原始观察证据。

mobile-late-hot / edge为修正筛选后130.1333/130.2333秒的新爆炸，4种叠枪、残骸、实际敌弹、奖励和成就提示共存；敌弹仍可辨认。本轮没有添加这些奖励/成就/武器，截图只是验证其保持可读。热芯也并非始终白亮，后续仍需动态真人观感和低端性能。
