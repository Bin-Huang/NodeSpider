
# Features
- Simple and flexible
- Funny **jQ** selector you must like it
- automatically decode body into **UTF8**(as an option), never worry about encoding anymore
- save extracted data by pipe, just enjoy
- easy to check and filter existed urls in queue.
- retry task easily and reliably
- rate limit & concurrent limit
- support async function and promise

```javascript
const { Spider } = require("nodespider");
const s = new Spider();

s.plan("getTitle", function(err, current) {
    const $ = current.$;
    console.log($("title").text());
});
s.queue("getTitle", "https://www.google.com");

s.download("./save/to/path", "https://www.npmjs.com/static/images/mountain-dot.svg");
```

# Installation & initialization

```bash
npm install nodespider --save
```

```javascript
const { Spider } = require("nodespider");

const mySpider = new Spider();

// or initialize with options
const myOtherSpider = new Spider({
    rateLimit: 20,
    maxConnections: 20,
    // and more options...
})
```

Optional settings:

| option | description | type | defaults |
| --- | ---- | --- | --- |
| rateLimit | request interval | number | 2(millisecond)
| queue | task queue | class | NodeSpider.Queue
| maxConnections | maximum number of simultaneous connections | number | 20 |

# Method

## Spider.prototype.plan(planName, callback)
添加一个默认计划

| name | type | description |
| --- | --- | --- |
| planName | string | 新计划的名称 |
| callback | function | 成功爬取body后、或者报错时执行的callback函数 |

执行 callback 时将传入三个参数：
- `err` when there aren't error , it will be `null`
- `current` current task's information
- - `response`
- - `body`  已经自动转码为**utf8格式**的返回正文
- - `url`
- - `planName`
- - `hasRetried`
- - `info`
- - `$` the **jQ selector** that you can use it to operate the body
- `spider`  this spider instance

// TODO $的有趣方法

```javascript
const s = new Spider();
s.plan("myPlan", (err, current, s) => {
    if (err) return s.retry(current);
    const $ = current.$;
    console.log($("title").text());
});
s.queue("myPlan", "http://www.google.com");
```

**提示** 如果你想亲自决定是否进行预处理（比如关闭jq加载、utf8格式转换），或者进行更加详细设置（比如修改请求 headers），建议你使用 `add` 方法来添加 default plan。

甚至，如果你想亲自决定任务如何执行，你可以使用 `add` 方法来添加你自己的计划。这些内容将在后文中提到。

## Spider.prototype.queue(planName, url, info)
添加链接到待爬取队列，并为该链接指定爬取计划。当队列轮到该链接时，将按照计划执行爬取任务。

| name | type | description |
| --- | --- | --- |
| planName | string | 指定计划的名称 |
| url | string or string array | 需要添加的url(s)。你还可以通过传入数组的方式，批量添加url |
| info | * | `(可选)`. 附带信息。当执行被添加url的任务时，`info`将以`current.info`形式传入 callback |

```javascript
s.plan("myPlan", (err, current) => {
    console.log(current.url);
    if (current.info) {
        console.log(current.info.from);
    }
});
s.queue("myPlan", "https://www.quora.com");
s.queue("myPlan", [
    "https://www.github.com",
    "https://www.baidu.com",
]);
s.queue("myPlan", "https://www.npmjs.com", {
    from: "google"
});
```

## Spider.prototype.download(path, url, fileName)
添加下载链接到待爬取队列，并指定保存路径。当队列轮到该链接时，将下载该链接指向的文件

| name | type | description |
| --- | --- | --- |
| path | string | 下载文件的保存路径 |
| url | string or string array | 需要添加的url(s) |
| fileName | string | `(可选)` .文件的保存名称 |

```javascript
s.download("./save/to/path", "https://www.npmjs.com/static/images/mountain-dot.svg");
s.download(
    "./save/to/path",
    "https://www.npmjs.com/static/images/mountain-dot.svg",
    "download.svg"
);
```

当`fileName === undefined`，下载文件将根据url以合法形式命名。所以不用担心命名问题
```javascript
s.download("./", "https://www.npmjs.com/static/images/rucksack-dot.svg");
// 保存的文件名为： npmjs.com!static!images!rucksack-dot.svg
```

**注意** 当下载任务出现错误时，将自动重试3次，超过后将直接 `console.log` 错误。

如果你想亲自决定如何处理错误，或者进行更多的下载设置，你可以使用 `add` 方法来添加 `download plan`。这些内容将在后文中提到。

## Spider.prototype.retry(currentTask, maxRetry, finalErrorCallback);

Retry the task. The task will be added to queue again.

| parameter | description | type |
| --- | --- | --- |
| currentTask | the task which need to be retried | object |
| maxRetry | (Optional) Maximum number of retries. Default: `1` | number |
| finalErrorCallback | (Optional) the function will be called when reach maximum number of retries | function |

```javascript
s.plan("myPlan", function (err, current) {
    if (err) return s.retry(current);
});
s.plan("otherPlan", function (err, current) {
    if (err) return s.retry(current, 10);
});
s.plan("anotherPlan", function (err, current) {
    if (err) return s.retry(current, 5, () => console.log(err));
});
```

## Spider.prototype.isExist(url)

Check whether the url has been added. If the url is in the queue, is crawling or has been crawled, return `true`.

| parameter | description | type |
| --- | --- | --- |
| url | the url you want to check | string |

| return | description |
| --- | --- |
| boolean | if the url exists, return `true`

```javascript
s.queue("myPlan", "http://www.example.com");
console.log(s.isExist("http://www.example.com"));    // true
```

## Spider.prototype.filter(urls)

Method `filter` return a new array of all unique url items which don't exist in the queue from provided array.

| parameter | type |
| --- | --- |
| urls | array (of string) |

| return |
| --- |
| array |

```javascript
s.queue(planA, "a.com");

var urls = n.filter(["a.com", "b.com", "c.com"]);
console.log(urls); // ["http://b.com", "http://c.com"]

urls = n.filter(["a.com", "aa.com", "aa.com"]);
console.log(urls); // ["http://aa.com"]
```

## Spider.prototype.add(planObject)
添加任意的一个计划
```javascript
s.add(defaultPlan({
    name: "myPlan1",
    callbacks: [
        (err, current, s) => console.log(current.url)
    ]
}));
s.queue("myPlan1", "https://www.google.com");
```

**什么是计划？**  在 nodespider 中，当爬虫从待爬取队列中获取url后进行的所有操作，我们称之为计划。

**什么是计划模板** 爬虫进行的操作往往大同小异，如果将计划中可以复用的部分（比如网络请求）整理起来，提供可以返回计划对象的函数，我们称之为计划模板

nodespider 自带了三个计划模板，可以帮助你快速新建一个爬取计划:
- `defaultPlan` (默认的计划模板) 向站点发送网络请求，然后将接受到的 response 传递给 callbacks，以暴露返回正文给开发者处理
- `streamPlan`  根据url发送网络请求，并将返回的流(stream)直接通过 callback 暴露给开发者
- `downloadPlan`    下载url指向的文件到本地，开发者可以通过 callback 来处理下载成功与失败的情况

使用方法: **[plan文档](./doc/plan.md)**

*在未来的版本，你还可以自行创建更加灵活的爬取计划，甚至是你自己的计划模板。目前 nodespider 已经基本具备这些能力，但 api 和文档尚未完善，所以敬请期待*


## Spider.prototype.connect(pipeObject)
添加一个数据管道
```javascript
s.connect(jsonPipe({
    name: "myJson",
    path: "./my.json",
    items: [title, article, publish_date],
}));
```

nodespider 自带了三个管道发生器，可以帮助你快速建立一个数据管道：
- `txt pipe`    数据以制表格式将保存到 txt 文档中
- `json pipe`   数据将以json格式储存
- `csv pipe`    数据将以 csv 格式储存

使用方法: **[pipe文档](./doc/pipe.md)**

## Spider.prototype.save(pipeName, data)
通过某个管道保存数据
```javascript
// connect a pipe
s.connect(jsonPipe({
    name: "myJson",
    path: "./my.json",
    items: [title, article, url],
}))
s.plan("saveDoc", (err, current, s) => {
    const $ = current.$;
    // save data through pipe
    s.save("myJson", {
        title: $("title").text(),
        article: $("#readme").text(),
        url: current.url,
    });
})
s.queue("saveDoc", "https://github.com/Bin-Huang/NodeSpider");
```

## Spider.prototype.end()
close the spider instance.

```javascript
const s = new Spider();
s.end();
s.plan(() => null); // throw error
```

# Event

## "empty"
When there aren't more task in the queue, the event "empty" will be emitted.

## "queueTask"
When add a new task to the queue, the event "queueTask" will be emitted with a parameter `taskObject`.

## "vacant"
When the queue is empty and all tasks has been done, the event "vacant" will be emitted.

# How to contribute
- Submit an **issue** if you need any help.
- Of course, feel free to submit **pull requests** with bug fixes or changes.
- Open source your own plan generator, pipe generator, pretreatment function or queue, etc. More better with a name `nodespider-*` to easily search, such like `nodespider-mysqlpipe`.
