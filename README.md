（开发阶段，部分接口有小概率修改的可能）

NodeSpider 是基于 Nodejs 的新一代爬虫框架。

# Feature

- **开箱即用**，用最少的代码开发五脏俱全的爬虫程序
- **计划规则与任务相分离**，再复杂的爬取需求也可以轻松实现
- **简单好用的数据管道**，保存抓取的数据是一件轻松的事情
- **自动转码 utf8、jQ选择器**……可爱的小功能该有的都有
- **性能优异**，你对异步并发有绝对的控制自由
- **丰富、简约的拓展接口**，玩在手里就像灵活的积木
- 支持现代 promise 和 async function
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

// 声明一个数据管道
s.pipe(csvPipe({
  name: "data",
  path: "./data.csv",
  items: ["url", "count"],
}))

// 声明一个爬取计划
s.plan(jqPlan({
  name: "extract",
  toUtf8: true, // 自动转码为 utf8
  retries: 3, // 失败自动重试
  handle: ($, current) => {
    const title = $("title").text() // 你想要的 jq 选择器
    console.log(title)
    s.save("data", {
      count: $("body").text().length,
      url: current.url,
    }) // 使用管道保存数据
    s.addU("extract", $("a").urls())  // 添加新任务
  },
}))

s.add("extract", "https://github.com/Bin-Huang/NodeSpider") // 添加新任务
```

# Document

[设置 Options](./doc/cn/option.md)

[爬取计划 Plan](./doc/cn/plans.md)

[数据管道 Pipe](./doc/cn/pipes.md)

[方法 API](./doc/cn/method.md)

[事件 Events](./doc/cn/event.md)

# 与 0.9.x 版本的不同

当前版本几乎是 0.9 的重构，不管是 api 还设计理念，大部分均已改变。如果你的项目依赖 0.9.x 版本，这里保留了 [0.9.3 版本文档](./doc/0.9.3/doc.md)

# Contribute

- 任何疑问、建议、Bug，欢迎提交 `Issuse`
- 分享这个年轻的项目给其他开发者、社区、邮件组
- 欢迎 `Pull Request`，尤其是：
  - 翻译文档到其他语言
  - 文档的修改和补充
  - ……
