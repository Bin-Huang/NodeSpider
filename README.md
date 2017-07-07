# Features
- 简单高效，扩展性强
- 支持 async function 和 promise

```javascript
const { Spider } = require("nodespider");

// 初始化一个爬虫
const n = new Spider({
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
const { Spider } = require("nodespider");

const n = new Spider();
// or
const nn = new Spider({
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

### planObject

传入`plan`的对象参数，对象成员有以下内容：

- **request (可选)** 即该爬取计划的网络请求设置，将决定执行该计划时爬虫如何发出网络请求。通过设置你可以伪造ip、模拟登录、设置cookies、伪造浏览器标示等。具体设置可见 [request文档](https://www.npmjs.com/package/request#requestoptions-callback)

- **pre (可选)** 该爬取计划的预处理列表。当成功请求到网页信息后，将对网页信息进行预处理。nodespider自带两个实用预处理函数：`preToUtf8` 将网页内容自动转码为utf8格式，`preLoadJq` 对该网页内容加载JQ选择器(power by cheerio)

- **info (可选)** 对执行该计划的每一个任务附带信息对象。`info`将作为`current`成员(属性)传递给`rule`

- **rule (必须)** 爬取规则函数，即对爬到的网页进行的操作。当网页信息爬取得到并预处理后，将调动`rule`函数，并传入两个参数`err`和`current`

### current
`rule`函数在执行时将传入两个参数：`error`和`current`。其中`current`对象包含了很多当前任务的信息：

- **url** 当前任务的链接
- **planKey** 当前任务指定计划的key
- **plan** 当前任务的指定计划
- **response**    请求回应
- **body**    返回正文
- **error**   任务执行中的错误（等价于rule函数error参数）
- **info**  当前任务附带的信息
- **special** (可能不存在)当前任务的特定计划设置;
- **maxRetry** (可能不存在)当前任务的最大重试次数限制
- **hasRetried**    (可能不存在)当前任务已经重试的次数
- **and more ...**  以及可能的更多成员属性
 
 **NOTE**   值得注意的是，当前任务的指定计划，或者是特定设置中的预处理函数，往往会修改`current`中的成员属性，甚至添加更多的成员属性，所以上面的清单不是`current`中所有的成员属性

## queue(planKey, url, special)

添加链接到队列，并指定对应的爬取计划。
所有添加到队列的链接，将排队等待抓取工作。

| 设置 | 说明 | 类型 |
| --- | ---- | --- |
| planKey | 该任务指定计划的key（由`plan`方法生成） | symbol |
|  url | 需要排队的链接 | string or array |
| special | (可选) 该任务特有的计划设置（将在爬取过程中覆盖指定计划的执行） | Object |

```javascript
const n = new Spider();
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

重试某项任务

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
const { Spider, jsonPipe, txtPipe } = require("nodespider");
const n = new Spider();
const txtPipe = n.pipe(jsonPipe("save/my.json"));

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
var jsonFile = n.pipe(jsonPipe("path/to/my.json"));

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
var txtFile = n.pipe(txtPipe("my.txt", ["name", "desc"]));
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
const myJson = n.pipe(jsonPipe("save_path/my.json"));
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

# pipe
nodespider自带了两个pipe发生器：`jsonPipe`和`txtPipe`，可以帮助开发者保存提取的数据到本地。

## jsonPipe(path, space)
数据将以json形式保存到本地

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| path | string | 保存文件路径 |
| space | number | （可选）缩进空格数 |

```javascript
const myJson = n.pipe(jsonPipe("path/to/my.json"));

const myPlan(function (err, current) {
    const $ = current.$;
    n.save(myJson, {
        name: $("#name").text(),
        desc: $("#desc").text(),
    })
})
```

## txtPipe(path, header)
数据将以txt表格形式写入（由制表符和换行符隔开）。
| 参数 | 类型 | 说明 |
| --- | --- | --- |
| path | string | 保存文件路径 |
| header | array | 表头元素数组 |

```javascript
const txt = n.pipe(txtPipe("path/to/my.txt", ["name", "age", "description"]));

n.save(txt, {
    name: "ben",
    age: 20,
    website: "example"
})
```

# 预处理函数
nodespider 自带了两个预处理函数：`preToUtf8`, `preLoadJq`，可以帮助开发者的快速解决很多常见问题。

## preToUtf8()
根据网页信息，自动将爬取正文转码为utf8格式。即将`current.body`修改为utf8格式。
```javascript
const { Spider, preToUtf8 } = require("nodespider");
const newPlan = n.plan({
    pre: [
        preToUtf8()
    ],
    rule: (err, current) => {
        console.log(current.body);
    }
})
```

## preLoadJq()
解析`current.body`并加载服务器端jQ选择器（power by bycheerio），并添加`current.$`成员。利用选择器，你可以非常方便的从返回正文中提取信息
```javascript
const justPlan = n.plan({
    pre: [
        preToUtf8(),
        preLoadJq(),
    ],
    rule: (err, current) => {
        const $ = current.$;
        console.log($("title").text());
    }
});
```