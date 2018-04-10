[beta]  现仅处于开发状态

```javascript
const { Spider, defaultPlan } = require("nodespider");

const s = new Spider();

s.plan("printTitle", defaultPlan((err, current) => {
    if (err) {
        s.retry(current, 3);
    } else {
        const $ = current.$;
        console.log($("title").text());
        s.add("printTitle", $("a").url());
    }
}));
s.add("printTitle", "https://github.com/explore");


const { csvPipe } = require("nodespider");

s.pipe("localCsv", csvPipe("./data.csv"));
s.plan("extract", defaultPlan((err, current) => {
    if (err) {
        s.retry(current, 3);
    } else {
        const $ = current.$;
        s.save("localCsv", {
            name: $(".package-name a").text(),
            readme: $("#readme").html().slice(0, 100),
        });
    }
}));
s.add("extract", [
    "https://www.npmjs.com/package/nodespider",
    "https://www.npmjs.com/package/got",
    "https://www.npmjs.com/package/tyty",
]);


const { downloadPlan } = require("nodespider");

s.plan("saveImg", downloadPlan("./download/myImg"));
s.add("saveImg", "https://www.npmjs.com/static/images/mountain-dot.svg");


s.end();
```

# Installation & initialization

```bash
npm install nodespider --save
```

```javascript
const { Spider } = require("nodespider");

const Spider = new Spider();

const otherSpider = new Spider({
    concurrency: 20,
    // more options...
})
```

## options

### concurrency
可同时执行异步任务的最大数量，默认 `20`。

### queue
爬虫任务队列对象。

你可以通过实现`IQueue`接口，自定义队列的保存方式和位置，比如保存在 redis 以实现简单的分布式爬取

```typescript
interface IQueue {
  add: (task: ITask) => void;
  jump: (task: ITask) => void;
  next: () => ITask|null;
  getLength: () => number;
}

interface ITask {
    uid: string;
    url: string;
    planName: string;
    hasRetried?: number;
    info?: {[index: string]: any};
}
```

### pool
爬虫的已添加链接池对象。

你可以通过实现`IPool`接口，自定义队列的保存方式和位置，比如保存在 redis 以实现简单的分布式爬取。

```javascript
interface IPool {
  add: (url: string) => void;
  has: (url: string) => boolean;
  size: number;
}
```

# Method

## Spider.prototype.plan(name, newPlan)
新建一个爬取计划
```javascript
s.plan("printBody", defaultPlan((err, current) => {
    console.log(current.body);
}))
s.queue("printBody", "https://www.google.com");
```

**什么是计划？**  在 nodespider 中，当爬虫从待爬取队列中获取url后进行的所有操作，我们称之为计划。

**什么是计划模板** 爬虫进行的操作往往大同小异，如果将计划中可以复用的部分（比如网络请求）整理起来，提供可以返回计划对象的函数，我们称之为计划模板

nodespider 自带了三个计划模板，可以帮助你快速新建一个爬取计划:
- `defaultPlan` (默认的计划模板) 向站点发送网络请求，然后将接受到的 response 传递给 callbacks，以暴露返回正文给开发者处理
- `streamPlan`  根据url发送网络请求，并将返回的流(stream)直接通过 callback 暴露给开发者
- `downloadPlan`    下载url指向的文件到本地，开发者可以通过 callback 来处理下载成功与失败的情况

使用方法: **[plan文档](./doc/plan.md)**

## Spider.prototype.add(planName, url, info)
添加链接到待爬取队列，并为该链接指定爬取计划。当队列轮到该链接时，将按照计划执行爬取任务。

| name | type | description |
| --- | --- | --- |
| planName | string | 指定计划的名称 |
| url | string or string array | 需要添加的url(s)。你还可以通过传入数组的方式，批量添加url |
| info | * | `(可选)`. 附带信息。当执行被添加url的任务时，`info`将以`current.info`形式传入 callback |

```javascript
s.plan("myPlan", defaultPlan((err, current) => {
    console.log(current.url);
    if (current.info) {
        console.log(current.info.from);
    }
}));
s.add("myPlan", "https://www.quora.com");
s.add("myPlan", [
    "https://www.github.com",
    "https://www.baidu.com",
]);
s.add("myPlan", "https://www.npmjs.com", {
    from: "google"
});
```

## Spider.prototype.retry(currentTask, maxRetry, finalErrorCallback);

Retry the task. The task will be added to queue again.

| parameter | description | type |
| --- | --- | --- |
| currentTask | the task which need to be retried | object |
| maxRetry | (Optional) Maximum number of retries. Default: `1` | number |
| finalErrorCallback | (Optional) the function will be called when reach maximum number of retries | function |

```javascript
s.plan("planA", defaultPlan((err, current) => {
    if (err) {
        s.retry(current, 3);
    }
}))
```

## Spider.prototype.has(url)

Check whether the url has been added. If the url is in the queue, is crawling or has been crawled, return `true`.

| parameter | description | type |
| --- | --- | --- |
| url | the url you want to check | string |

```javascript
s.add("printBody", "http://www.example.com");
console.log(s.has("http://www.example.com"));    // true
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
s.add(planA, "a.com");

var urls = n.filter(["a.com", "b.com", "c.com"]);
console.log(urls); // ["http://b.com", "http://c.com"]

urls = n.filter(["a.com", "aa.com", "aa.com"]);
console.log(urls); // ["http://aa.com"]
```


## Spider.prototype.pipe(name, target, fields)

添加一个数据管道

```javascript
const { jsonPipe } = require("nodespider");

s.pipe("data", jsonPipe("./data.json"), [
  "name",
  "description",
])

```

### target

nodespider 自带了三个管道发生器，可以帮助你快速建立一个数据管道：

- `txtPipe`    数据以制表格式将保存到 txt 文档中
- `jsonPipe`   数据将以 json 格式储存
- `csvPipe`    数据将以 csv 格式储存

使用方法: **[pipe文档](./doc/pipe.md)**

### fields



```typescript
s.pipe("trimedData", jsonPipe("./trimedData"), {
  "name": (s) => s.trim()
  "description": (s) => s.trim().slice(0, 100)
})
```

## Spider.prototype.save(pipeName, data)

通过指定的管道保存数据

```typescript
s.save("trimedData", {
  title: "title",
  description: "hello, world"
})
```

常见的使用场景是爬取过程中保存抓取的数据：

```javascript
s.pipe("data", csvPipe("./data.json"), [
  "name",
  "document",
  "url",
])
s.plan("getDocument", defaultPlan((err, current, s) => {
  const $ = current.$;
  // save data through pipe
  s.save("myJson", {
    name: $("title").text(),
    document: $("#readme").text(),
    url: current.url,
  });
}))
s.add("getDocument", "https://github.com/Bin-Huang/NodeSpider");
```

### 快捷写法

除了提前用 `pipe` 方法声明外，你还可以在不声明的情况下直接保存数据到 `jsonPipe`, `txtPipe`, `csvPipe`：

```javascript
s.save("./urls.csv", {
  name: "NodeSpider",
  url: "https://github.com/Bin-Huang/NodeSpider"
})

// 上面的写法等价于：

// s.pipe("./urls.csv", csvPipe("./urls.csv"), ["name", "url"])
// s.save("./urls.csv", {
//   name: "NodeSpider",
//   url: "https://github.com/Bin-Huang/NodeSpider",
// })
```

NodeSpider 会根据 planName 的路径及后缀（仅限 `.txt`, `.csv`, `txt`）、并根据 data 属性为 fields 自动建立对应的 pipe，然后再保存数据。如果你不需要在保存时对数据项进行加工，可以使用这种方法

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
