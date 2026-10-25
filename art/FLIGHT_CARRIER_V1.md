# 增援载机原创资产 · Stage319

内置image_gen创建，原输出保留，复制[source/flight-carrier-v1.png](source/flight-carrier-v1.png)。完整[提示](FLIGHT_CARRIER_V1_PROMPT.md)保留，无商业游戏参考、CLI/API回退或密钥访问。源1254×1254 RGBA，SHA 38c001fc1af25e415d58f3fa62b999a936d2b1e4af9ae4f6d68ae0201af690ad。深枪灰/钛装甲、铜管/橙红警示、双空舱口，前下后上。

实际船体占比高于所请求72%宽/68%高，但无裁切；3px强边界0、非零alpha792879。整方形缩384，未裁剪/擦边/阈值抠图/补画。运行[PNG](../public/assets/flight-carrier-v1.png)233515字节，SHA 959ae7ae6570f044b027a6206676dfb4375694bc0e15684cfd2708e29c6e6dd8。导出守卫tools/export-flight-carrier.mjs，元数据build/art/flight-carrier-v1.json。

黑色舱口人工校准源像素(390,710)/(866,710)，RGBA分别3/3/3/252、1/2/2/249，不称CAD精确。模拟放飞与渲染共享156逻辑px整图换算，空舱不烘焙无人机，子机为实际原drone-v1实体。自制火花/舱灯/损坏残骸按当前状态显示，敌方危险层最后绘制，不画未来射击线。不是真人美术签收，实际运行证据见319验证。
