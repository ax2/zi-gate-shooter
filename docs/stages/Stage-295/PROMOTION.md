# Stage295 固定试玩入口更新

准备中：候选build/candidate/Stage-295，60文件15373647字节，index-DJelG2b2.js。计划先验证并保留291完整目录，再复制当前候选到build/playable/Stage-295，资产先落盘、index.html最后原子替换到dist；旧哈希脚本作为兼容缓存保留，不删除历史。会逐文件核对5178响应SHA。

这属于本地试玩候选，不代表原生浏览器/人类/设备/平台验收或正式发布。操作尚未执行，实际结果待下节。

## 已执行结果（2026-10-24）

已先同步独立长期档案f48d885，再核对原291的59文件15174534字节，保留build/playable/Stage-291；新60文件15373647字节完整保存在build/playable/Stage-295。候选资产先复制到dist，最后只用fs.rename原子替换index.html；没有递归移动/删除、没有重启服务。5178进程仍66776，5278开发进程仍65104。

固定入口http://127.0.0.1:5178/当前script为./assets/index-DJelG2b2.js，候选60文件HTTP响应全部200，逐字节SHA256匹配。dist物理61文件，额外保留旧assets/index-CGsJiavW.js供已打开291客户端兼容；不是缺失文件或未清理的新构建。原291快照再次逐文件核对通过。证据build/qa/Stage-295/promotion.json。

这是本地试玩候选更新，HTTP和Native离屏不替代原生浏览器、控制台、人类/设备/平台验收。没有执行回退或正式上架。仓库主线与阶段分支同步由后续Git记录追踪。
