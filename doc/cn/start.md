（开发阶段，部分接口有小概率修改的可能）

NodeSpider 是一个基于 Nodejs 的新一代爬虫框架。

# Feature

- 开箱即用，用最少的代码快速开发五脏俱全的爬虫程序
- 计划规则与任务相分离，再复杂的爬取需求也可以轻松实现
- 简单好用的数据管道，保存抓取数据是一件轻松的事情
- 自动转码 utf8、jQ选择器……可爱的小功能该有的都有
- 性能优异，你对异步并发有绝对的控制自由
- 丰富、简约的拓展接口，支持你天马行空的想象力和伟大需求
- 更多等待发现的特性……

# Install

npm:

```
npm install nodespider --save
```

yarn:

```
yarn add nodespider
```

# Example

```javascript
const { Spider, jqPlan, csvPipe } = require("nodespider")
const s = new Spider()

// 声明一个名为 data 的数据管道
s.pipe(csvPipe({
  name: "data",
  path: "./data.csv", // 数据将被写入到本地的 data.csv 文件
  items: ["title", "url"],
}))

// 声明一个名为 extract 的爬取计划
s.plan(jqPlan({
  name: "extract",
  toUtf8: true, // 自动转码返回正文为 utf8，再也不用担心编码问题
  retries: 3, // 若失败则自动重试，但最多 3 次
  handle: ($, current) => {
    const title = $("title").text()  // 没错，jqPlan 让你可以使用 jQ 选择器
    s.save("data", { title, url: current.url })  // 通过数据管道保存抓取的数据
    s.addU("extract", $("a").urls())  // 将该页面的所有的新链接都作为新任务添加
  },
}))

s.add("extract", "https://github.com/Bin-Huang/NodeSpider") // 添加第一个任务
```

# Document

# Contribute

- 任何疑问、建议、Bug，欢迎提交 `Issuse`
- 分享这个年轻的项目给其他开发者、社区、邮件组
- 欢迎 `Pull Request`，尤其是：
  - 翻译文档到其他语言
  - 文档的修改和补充
  - ……