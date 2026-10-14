2026-10-14 Stage-71：仅改耐久夹具，结束时sessionStorage保存终止证据，新增JSON导出。避免页面重载覆盖上一场记录；不修改生产玩法或耐久门槛。
# Stage-71 耐久记录保留（2026-10-14）
仅修改开发夹具。终止时保存完整记录到sessionStorage，重载后显示上次原因/时长，并可下载JSON；新运行不在启动时覆盖上次终止记录。存储失败时提示立即导出；pagehide尝试保留终止状态。生产游戏与APK不变。
实际浏览器UI：开始→手动停止（约0.2秒）→重载，仍显示manual-stop及原时长；导出按钮成功下载gate-endurance-ended.json，读取内容active=false、stopReason=manual-stop且有保存时间。控制台无error/warn，node --check通过。截图和导出JSON在build/qa/Stage-71。这只是保留/导出功能检查，不是耐久通过。
sessionStorage只在同一页签会话内保留；关闭页签/浏览器会话销毁不能保证恢复。此次检查中旧页签15/16先后失效、列表清空，已创建新页签完成测试；不把页签重建当旧测试继续。pagehide分支未单独验证，不宣称所有终止方式已验。
用户确认目前武器方向合适，继续打磨整体体验；该反馈不代替最终美术/设备/发行验收。
