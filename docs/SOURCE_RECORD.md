# 来源、证据与公开范围

2026-10-11 / Stage-00。

## 原始输入

用户提供 `gate_shooter_codex_handoff.zip`，SHA-256：`7173493AFE9E208FB97A3ECD8DD28C53C0F9258F3DBC3DAEEB33FD873EACE331`。仅作为输入保留，不新建分发ZIP。

| 包内路径 | 保留副本 |
|---|---|
| AGENTS.md | reference/AGENTS.original.md |
| CODEX_START_PROMPT.md | reference/CODEX_START_PROMPT.original.md |
| README.md | reference/README.original.md |
| docs/GAME_DESIGN_HANDOFF.md | reference/GAME_DESIGN_HANDOFF.v0.1.md |

4文件保留原始字节，逐项哈希记录见 [SOURCE_MANIFEST.json](SOURCE_MANIFEST.json)。原文未写入本轮修订；当前方案是新的GAME_DESIGN_HANDOFF.md。原始说明中的“开始开发”指令模板不是本轮用户指令；本轮以用户明确的“先完善策划、不开始实现”为界。

本轮不访问或推断上一段聊天，也不将文档提及的商业游戏机制当作验证过的事实。只按实际输入与当前目录状态描述历史。没有截图、概念图、源码和性能证据，保留这一缺口。

## 外部技术依据

2026-10-11读取 [Phaser官方：Using the Create Phaser Game app](https://phaser.io/tutorials/create-game-app)。官方页面列出Vite构建器并说明大部分模板支持JavaScript/TypeScript；因此原有技术方向可作为候选保留。这不验证某组具体版本的兼容性，未运行脚手架或安装依赖；开发时再核实并锁定版本。

其余游戏规则、数值、视觉预算、性能门槛全部是本项目的设计提案，非商业游戏数据、市场结论或实测结果。不引入第三方截图、美术或音频作为可分发素材。

## 公开内容与持续档案

公开仓库只含本项目策划、原始交接文档、来源哈希、协作规则和MIT许可。本轮检查不上传源ZIP，不读取/复制其他项目源码、公司配置或运行环境，不包含凭据。技术博客长期档案独立保存本地Git历史，不将整个博客目录上传GitHub。
