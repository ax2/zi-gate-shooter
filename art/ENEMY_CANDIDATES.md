# 普通敌人动作候选 / Stage-19

两轮均来自本会话内置imagegen：v1参考本项目原创source/units.png，v2参考v1修订。实际完整提示词见enemies-v1-prompt.md。来源文件分别exec-e5833f7f-3ccc-4070-af8a-b97f4f414708.png与exec-e1831895-3618-4b55-8e68-dbd3ade26fce.png；本地保留source/enemies-atlas-v1.png和v2.png，未使用外部商业游戏素材或API密钥。

候选原图随项目MIT开放，不宣称角色/商标独占或未经核查的第三方权利保证。两版均未批准、未接入运行资源：存在跨格、尺度和边缘问题。尺寸/源哈希/逐格数据见../docs/stages/Stage-19/SOURCE_INSPECTION.json。该报告由tools/inspect-enemy-candidates.mjs重新生成，不裁图、不重画、不调用生成服务。

拟定语义：无人机平飞/上折翼/下折翼；冲锋机巡航/蓄势/冲锋；重甲履带A/准备射击/履带B。重甲第三帧不代表后坐或击毁。后续接入应只读模拟age/warning，冲锋1.8～2.6秒、重甲0.6秒预警，与规则同步并保留外部危险标识。尚未实现或测试这些动画。
