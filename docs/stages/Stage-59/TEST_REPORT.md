# Stage-59 实际渲染长局结果
2026-10-14，运行代码基线10d6451，1280×720，DPR1.25，标准特效，真实时钟，正常T1成长，自动横移操作者。
同一次长局于159.333秒停止，第二轮首领阶段，HP3；stopReason unexpected-paused，notice 切换至后台，已暂停。末帧hidden=false/focused=false/mode=paused，前帧focused=true；重新观察时focused又为true。最大回调间隔40.3ms，非积压保护触发。不能据最终focused=true推断未失焦，也没有证据确定哪个外部动作导致失焦。
首轮实际81.233秒首领击破、85.25秒第二轮；第二轮159.283秒进入首领。运行执行耗时P99约1ms，不是GPU/整帧/真机性能结论。停止后活跃音效0、音乐paused=true。27716个回调。20分钟连续渲染未通过；规则模拟不能替代。
原始final.json、1200帧环形记录与截图位于build/qa/Stage-59。检查点保留，不覆盖为最终通过。

## 诊断改动
开发耐久入口增加最多100条blur/focus/visibilitychange记录，保留事件当时模拟时间、墙钟时间、可见性、焦点和模式；修正scope固定写mobile viewport的错误，以final实际宽高为准。生产游戏行为未改。
node --check通过；独立新运行通过CDP派发合成blur，0.1667秒暂停并记录blur，合成事件document.hasFocus仍true属预期，因此该记录仅验证监听/暂停，不伪称操作系统失焦证据。保存synthetic-blur-check.json，与原159秒运行分开。测试完成后返回正常游戏入口，没有仍在运行的耐久会话。
本阶段没有新APK或完整回归。真机、人评、20分钟连续渲染和发布验收仍待完成。
