# Stage-37 配置验证（2026-10-13）

已接入用户提供的微信AppID，仅进入本地忽略的build/wechat/project.config.json及候选目录。项目类型保持game。没有使用AppSecret，没有新增登录、服务端鉴权或后台。

类型检查与微信构建通过；移除本次临时环境变量后再次普通重建，AppID仍保留。31个有效文件逐个匹配manifest SHA256，总3393909字节（不含manifest）。候选保留在build/releases/Stage-37/wechat。该检查证明配置与打包，不证明AppID对应账号已获小游戏资格；未开发者工具导入、登录、上传、审核或真机运行。

Android继续沿用Stage-35候选，游戏规则与素材没有变化，不重跑无关游戏回归或生成新APK。用户已确认沿用当前光效方向，正式视觉/性能验收未完成。其他退出条件见RELEASE_READINESS.md。

导入时选择本阶段输出中的wechat完整目录，project.config.json已包含AppID。使用微信开发者工具实际校验账号/项目类型并预览；不要在前端代码或配置中填写AppSecret。
