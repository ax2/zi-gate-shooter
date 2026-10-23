# Stage296 本地试玩候选

2026-10-24，固定入口 http://127.0.0.1:5178/ 已更新本轮候选。60文件15376413字节，入口`./assets/index-BxbDZN9A.js`。逐个HTTP200与SHA256校验通过，源码开发入口仍5278。完整候选保留在`build/candidate/Stage-296`和`build/playable/Stage-296`。

更新前已提交独立长期档案的开发/设计/测试记录。更新时先复制资产，再以单个index文件原子替换切入口；没有递归删除/移动、没有重启服务。Stage295完整60文件目录已按原清单SHA重新核对，旧291/295入口脚本继续留在dist以兼容旧客户端。

这只是本地可玩候选更新；HTTP/哈希通过不表示原生浏览器、控制台、真人理解或设备FPS验收。当前浏览器连接不可用，未声称这些通过。构建和更新证据在`build/qa/Stage-296/candidate-build.json`、`promotion.json`与`deliver.log`，长期档案有独立副本。
