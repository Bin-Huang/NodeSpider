# Features
- 简单高效，扩展性强
- 支持 async function 和 promise

```javascript
const NodeSpider = require("nodespider");

// 初始化一个爬虫
const n = new NodeSpider({
    rateLimit: 10
});

// 声明一个爬取计划
const planA = n.plan(function (err, current) {
    if (err) {
        return n.retry(current, 3);
    }
    const $ = current.$;
    console.log($("title").text());
});

// 添加链接到爬取队列，并指定爬取计划
n.queue(planA, "https://www.nodejs.org");
```

# 初始化

```javascript
const NodeSpider = require("nodespider");

const n = new NodeSpider();

// or
const nn = new NodeSpider({
    rateLimit: 20,  // 每20毫秒爬取一次
    // 以及更多设置
})
```

# 方法与属性

## plan(item)

在开始爬取前，你应该告诉爬虫你的爬取计划。例如，如何操作并提取返回正文的信息、你的爬取策略，请求时的header等。使用 `plan` 方法声明一个爬取计划，你可以详细描述你的爬取策略、请求设置、以及对返回的预处理。

item type: function | object

对当前爬虫声明一个爬取计划，并返回该计划的唯一标识符key(symbol, 用于方法 queue)。

```javascript
const myPlan = n.plan(function (err, current) {
    // your crawl rule
})

const otherPlan = n.plan({
    request: {
        method: "POST",
        header: {

        }
        // or more
    },
    pre: [],
    rule: function (err, current) {
        // your crawl rule
    },
})
```

## queue(planKey, url)

添加链接到队列，并指定对应的爬取计划。
所有添加到队列的链接，将排队等待抓取工作。

planKey type: symbol    由 plan 方法声明的计划key
url type: string | array    链接字符串，或者链接字符串的数组

```javascript
const n = new NodeSpider();
const myPlan = n.plan(function (err, current) {
    // your rule
});

n.queue(myPlan, "https://en.wikipedia.org");
n.queue(myPlan, [
    "http://www.github.com",
    "https://stackoverflow.com/",
    "https://nodejs.org"
]);
```