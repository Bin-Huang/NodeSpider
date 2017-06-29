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
可选的设置：

| 设置 | 说明 | 类型 | 默认值 |
| --- | ---- | --- | --- |
| multiDownload | 最大同时下载数 | number | 2 |
| multiTasking | 最大同时抓取数 | number | 20 |
| rateLimit | 限速，网络请求的时间间隔（毫秒） | number | 2(毫秒)
| queue | 任务排队队列 | Object | NodeSpider.Queue

# 方法与属性

## plan(item)

在开始爬取前，你应该告诉爬虫你的爬取计划。例如，如何操作并提取返回正文的信息、你的爬取策略、请求时的header等。使用 `plan` 方法声明一个爬取计划，你可以详细描述你的爬取策略、请求设置、以及对返回的预处理。

| 参数 | 说明 | 类型 |
| --- | --- | --- | --- |
| item | 爬取策略函数或爬取策略 | function or object |


对当前爬虫声明一个爬取计划，并返回该计划的唯一标识符key(symbol, 用于方法 queue)。

```javascript
const myPlan = n.plan(function (err, current) {
    // your crawling rules
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

n.queue(otherPlan, "https://www.example.com");
```

## queue(planKey, url)

添加链接到队列，并指定对应的爬取计划。
所有添加到队列的链接，将排队等待抓取工作。

planKey type: symbol    由 plan 方法声明的计划key

url type: string | array    链接字符串，或者链接字符串的数组

```javascript
const n = new NodeSpider();
const myPlan = n.plan(function (err, current) {
    // some crawling rules
});

n.queue(myPlan, "https://en.wikipedia.org");
n.queue(myPlan, [
    "http://www.github.com",
    "https://stackoverflow.com/",
    "https://nodejs.org"
]);
```

## retry(task, maxRetry, finalErrorCallback);

重试某次任务

| 参数 | 说明 | 类型 |
| --- | --- | --- |
| task | 需要重试的当前任务 | object |
| maxRetry | （可选）该任务的最大重试数目（最多重复多少次）。默认: 1 | number |
| finalErrorCallback | （可选）达到最大重试数目时调用的函数 | function |

```javascript
const myPlan = n.plan(function (err, current) {
    if (err) {
        return n.retry(current);
    }
});
const otherPlan = n.plan(function (err, current) {
    if (err) {
        // 如果出现错误，重试当前任务，但最多不超过10次
        return n.retry(current, 10);
    }
});
const anotherPlan = n.plan(function (err, current) {
    if (err) {
        // 如果出现错误，重试当前任务，但最多不超过5次
        return n.retry(current, 5, (current) => {
            // 当重复次数达到五次时，调用回调函数
            console.log(current.url);
        })
    }
});
```

## isExist(url)

检查是否添加过某个链接

url type: string

returns type: boolean

```javascript
n.queue(myPlan, "http://www.example.com");
n.isExist("http://www.example.com");    // True
```

## filter(urls)
过滤掉一个数组中的重复链接，以及所有已被添加的链接，返回一个新数组

urls    type: array

return  type: array

```javascript
n.queue(planA, "http://a.com");

var i = n.filter(["http://a.com", "http://b.com", "http://c.com"]);
console.log(i); // ["http://b.com", "http://c.com"]

var j = n.filter(["http://a.com", "http://aa.com", "http://aa.com"]);
console.log(j); // ["http://aa.com"]
```

## pipe(pipeGenerator)

*使用方法 pipe 和 save，可以方便地保存抓取的数据。*

在当前实例注册一个pipe，并返回对应的key（用于 save 方法）。

| 参数 | 说明 | 类型 |
| --- | --- | --- |
| pipeGenerator | pipe生成器新建的对象 | object |

```javascript
const txtPipe = n.pipe(NodeSpider.jsonPipe("save/my.json"));

n.save(txtPipe, {
    name: "ben",
    age: 20,
});
```

通过加载不同的pipe生成器，你可以方便地任意地保存数据。nodespider自带了两个pipe发生器: `txtPipe` 和 `jsonPipe`

### NodeSpider.jsonPipe(path, space)
返回一个将数据以json格式写入制定路径文件的pipeGenerator

| 参数 | 说明 | 类型 |
| --- | --- | --- |
| path | 文件路径 | string |
| space | （可选）排版的空格数量 | number |

```javascript
var jsonFile = n.pipe(NodeSpider.jsonPipe("path/to/my.json"));
n.save(jsonFile, {
    title: "some",
    desc: "data",
});
```

### NodeSpider.txtPipe(path, header)

返回一个将数据以txt表格形式写入制定路径文件的pipeGenerator

| 参数 | 说明 | 类型 |
| --- | --- | --- |
| path | 文件路径 | string |
| header | 表头关键字数组 | array |

```javascript
var txtFile = n.pipe(NodeSpider.txtPipe("my.txt", ["name", "desc"]));
n.save(txtFile, {
    name: "NodeSpider",
    desc: "a crawler package",
});
```

## save(pipeKey, data)

保存数据到指定pipe

| 参数 | 说明 | 类型 |
| --- | --- | --- |
| pipeKey | 指定pipe的key，由 `pipe` 方法生成 | symbol |
| data | 需要保存的数据 | object |

```javascript
const myJson = n.pipe(NodeSpider.jsonPipe("save_path/my.json"));
const planA = n.plan(function (err, current) {
    if (err) {
        return n.retry(current);
    }
    const $ = current.$;

    // 保存抓取的数据到本地 my.json 文件
    n.save(myJson, {
        name: $("#name").text(),
        age: $("#age").text(),
        description: $("#desc").text(),
    });
})
```