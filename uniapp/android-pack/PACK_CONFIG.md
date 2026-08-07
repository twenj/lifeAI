# 离线打包配置
- appid: __UNI__F35B226
- 包名: uni.app.UNIF35B226
- Android AppKey: 011a96325e13804621353f0e03568fdb
- 证书: lifeai.keystore (别名 lifeai, 密码 lifeai123)
- 证书 SHA1: AB:2D:A4:01:C3:80:26:E8:69:75:1A:F8:79:97:4C:82:C2:26:A9:78
- App 资源: apps/__UNI__F35B226/www (由 uni build -p app 生成)
- SDK 版本要求: 5.21.2026071110-alpha (与编译器 5.21 匹配)

## 最终生效的关键配置（踩坑记录）
- Android AppKey: 011a96325e13804621353f0e03568fdb (SHA1 与证书绑定，改证书需重登记)
- Uni Push v1: AppID=QTO85N8FL06wTORSVuJXs6 AppKey=SEqiFLtBmIAUCMWOaW29T3 AppSecret=XTGxuc8RQJ7L6Nt94PUb7A
  填在 simpleDemo/build.gradle 的 manifestPlaceholders (GETUI_APPID / plus.unipush.*)
- Push 模块依赖 (simpleDemo/build.gradle): com.getui:gtsdk:3.3.7.0, com.getui:gtc-dcloud:3.2.16.7
- 个推 Maven 仓库需加到根 build.gradle allprojects: https://mvn.getui.com/nexus/content/repositories/releases/
- libs 额外加入: aps-unipush-release.aar (来自 SDK/libs)
- 关键: simpleDemo/src/main/assets/data/dcloud_properties.xml 必须在 <features> 里注册
  <feature name="Push" value="io.dcloud.feature.aps.APSFeatureImpl">
    <module name="unipush" value="io.dcloud.feature.unipush.GTPushService"/>
  </feature>
  (simpleDemo 默认只有 service 没有 feature → 会报"打包时未添加push模块")

## 重新打包命令
cd uniapp && pnpm run build:app   # 重新生成 App 资源到 dist/build/app
# 资源拷到 HBuilder-Integrate-AS/simpleDemo/src/main/assets/apps/__UNI__F35B226/www
cd android-pack/sdk/Android-SDK@5.21.82652_20260713/HBuilder-Integrate-AS
JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" ./gradlew :simpleDemo:assembleRelease
adb install -r simpleDemo/build/outputs/apk/release/simpleDemo-release.apk
