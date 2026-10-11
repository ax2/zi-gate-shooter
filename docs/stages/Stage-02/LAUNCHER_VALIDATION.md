# Stage-02启动资产与原生适配验证

2026-10-11，开发快照。此前d6002e7候选和记录保留；本轮不声称完成上架质量。

## 实际改变

内置imagegen参考既有原创机甲图集生成1254×1254透明启动资产，保存art/source/launcher-mech-v1.png与完整提示词art/PROMPTS.md。生成未满足要求的中央留白尺寸，导出脚本进行技术缩放并检查显著alpha范围：五档前景都在66dp安全圆内，最大半径32.41dp。512px商店图仅为候选，未上传商店。

五密度legacy图标、圆形图标、自适应前景、单色alpha层和系统启动标记均接入。移除11个模板启动PNG与4份无引用模板XML；旧文件可从Git d6002e7恢复。启动主题使用AndroidX SplashScreen、与游戏一致的深色底，不增加等待、启动Activity或联网。

源码核实Capacitor默认系统栏随手机主题决定文字颜色，浅色手机主题可能在游戏深色底上显示深色字。改为SystemBars DARK浅色前景、css安全区并预告viewport cover。Android12+明确cloud/device-transfer排除全部本地数据域，旧系统禁用fullBackupContent；本地最高分/设置不承诺跨设备保存。

## 已执行检查

- npm run build:android成功：类型检查、原生资源同步、assembleDebug、lintDebug、apksigner verify、包内资源检查。最后构建34秒。
- App lint从19警告降为5警告，0错误；未建立新基线或屏蔽问题。保留两项版本更新提示、竖屏/Android16大屏旋转两项提示、Capacitor生成config.xml未使用提示。
- 最终APK4964969字节，SHA256 7F01620506728ACF928566181264DBF3BB5B7D9236A12F0016B3A8E710271007。debug签名，不是release签名。
- APK内13个本地Web文件逐SHA256匹配，另2个Capacitor兼容文件严格0字节；无server配置，SystemBars DARK/css配置实际在包内。
- 从APK提取15个密度图标和1个启动标记，对比解码后的RGBA，16项全部一致；包内不存在旧splash.png。此为编译资源校验，不是原生渲染验收。
- aapt最终权限仍仅应用内部signature接收器权限，无网络/敏感权限。合并manifest包含allowBackup=false/fullBackupContent=false/dataExtractionRules与启动主题。
- 浏览器资产预览分别检查桌面1280×720及手机390×844请求视口，保存全页截图。默认浏览器截图可能扣除滚动条；均为资源说明页，非原生界面。圆形/圆角不切主体，48px轮廓和青色核心可辨，主题单色轮廓可见；手机换为单列，无文字横向溢出。
- adb devices仍无设备；未执行原生安装、冷启动、离线启动、系统栏、备份行为或系统切换验证。

本轮没有修改共享游戏规则/战斗渲染，因此未重复全套300回放；34项游戏自动测试通过记录沿用前一快照，不能写成本轮重跑。新增的是资源导出安全圆和实际APK图像/配置核验，不以静态检查代替真机。

## 剩余质量门槛

原创方向与名称签收、Android/微信真机、原生启动过渡与系统栏/安全区、音频听审、中低端帧时/内存/温度/正常长局、完整Android依赖许可、正式签名与渠道审核仍未完成。图标三管构图是入口候选表达，游戏武器阶段及数值没有因此更改。

依据：[Android SplashScreen迁移](https://developer.android.com/develop/ui/views/launch/splash-screen/migrate)、[自适应图标](https://developer.android.com/develop/ui/compose/system/icon_design_adaptive)、[备份规则](https://developer.android.com/identity/data/autobackup)。
