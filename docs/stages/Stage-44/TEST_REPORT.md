# Stage-44 整合验收
2026-10-14，代码基线e8c90ae。整合Stage-41环境、Stage-42背景位移、Stage-43跨轮武器提示；无新增玩法改动。
npm test完整运行：29文件、175项全部通过，136.08秒。本次是单次完整通过，不是汇总分批结果。覆盖奖励、武器选择、首领、路线、渲染、加载、输入、音频及构建兼容。
三条20分钟普通成长轨迹使用全知脚本操作员、固定模拟步，非真人、非渲染验收。结果从测试固定输出目录复制到build/qa/Stage-44/progression，避免把本次结果误认成历史Stage-30证据。
Android同步/类型检查、编译、lint、开发签名核验通过；构建1分14秒。34个本地文件哈希和16张原生图像像素一致。
APK：8006032字节；SHA256 766E144540FD6727E39772A67E8DC87AFDFC1737A3494B8FEC7527AD35CF24D2。deviceVerified=false，storeSubmitted=false。
日志：build/qa/Stage-44/tests.log、android.log；APK/核验：build/releases/Stage-44/android。交付副本已核对哈希。
本轮没有新增截图或真人试玩。正式性能、20分钟真实渲染、Android真机、最终美术和发布签名仍未验收；公众号/平台接入继续后置。
