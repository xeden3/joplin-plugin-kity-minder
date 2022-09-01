# joplin-plugin-kity-minder  Kity Minder Mindmap Tools 思维导图插件

基于Joplin的思维导图（脑图）插件
作者使用了包括 PlantUML 在内的思维导图解决方案，还是觉得无法很好的呈现思维导图，基于作者是Leanote的忠实用户，发现Joplin下没用Kity Minder的思维导图工具
被迫无奈，只能自己开发一个插件给自己使用

项目开源，希望大家也能很好的用上

在此感谢FEX团队和Kity Minder的开源项目[kity-minder](https://github.com/fex-team/kityminder-editor.git)
以及wythe0102提供的本地化Kity Minder项目[local-kity-minder](https://github.com/wythe0102/local-kity-minder)

## 例子 Example

![kity-minder in action](https://github.com/xeden3/joplin-plugin-kity-minder/blob/main/doc/demo.gif?raw=true)

## 安装 Install the plugin
可以使用文件安装或者通过Joplin内置搜索安装

### 从文件安装 Manual installation
1 先通过 https://github.com/xeden3/joplin-plugin-kity-minder/releases 下载最新版本的 com.sctmes.kity-minder.jpl 和 com.sctmes.kity-minder.json 文件，并放入同一个文件夹
2 打开Joplin的 "工具\选项\插件" 菜单，点击 "管理你的插件"，选择 "从文件安装"，选择对应的 com.sctmes.kity-minder.jpl 即可

Download the last release from this repository. https://github.com/xeden3/joplin-plugin-kity-minder/releases
Open Joplin > Options > Plugins > Install from File
Select the jpl file you downloaded.

### 通过搜索安装 Automatic installation
1 打开Joplin的 "工具\选项\插件" 菜单，在搜索框上填入mind关键字
2 选择 kity-minder 进行安装
该安装方法需要等待npm同步插件信息，某些网络区域可能无法搜索出结果

Use the Joplin plugin manager to install it (Joplin > Options > Plugins). Search for mindmap.

