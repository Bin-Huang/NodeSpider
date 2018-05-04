# requestPlan

```javascript
const { Spider, requestPlan } = require("nodespider");
const s = new Spider();

s.plan("printBody", requestPlan((err, current) => {
    if (err) {
        s.retry(current, 3);
    } else {
        console.log(current.body);
    }
}));
s.add("printBody", "http://www.github.com");
```

## options

```javascript
// 1)
requestPlan(callback)
// 2)
requestPlan({ callback, toUtf8, jQ, requestOpts })
```

### callback
通过callback函数，你可以对访问结果、爬取情况进行处理。无论请求成功还是失败，都会调用callback函数。
函数在执行时将传入三个参数：
- `err` 如果请求成功，则为 `null`
- `current` 当前任务对象
- - `response`  [Node.js HTTP response stream](https://nodejs.org/api/http.html#http_class_http_incomingmessage)
- - `body`  返回正文。当设置项 `toUtf8`为 `true`，将被自动转化为 utf-8 格式
- - `url`   当前任务的url
- - `uid`    当前任务的uid
- - `planName`  任务指定的爬取计划名称
- - `hasRetried`    （不一定总是存在）当前任务已经重试的次数
- - `info`  该任务附带的信息对象。当使用方法 `add` 添加新任务时，可以为任务附带相关信息
- - `$` jQ选择器，仅当设置项`jQ`为`true`时存在，否则为 `undefined`
- `spider`  当前爬虫实例

callback 支持 async function 和 promise。如果你需要在callback执行异步操作，请使用 async function 或返回 promise。

### toUtf8
是否自动将`current.body`转化为`utf-8`格式

**可选，默认为 `true`**

### jQ
当设置项`jQ`为`true`时，你可以通过`current.$`选择器更轻松地处理返回正文。powers by [cheerio]("https://www.npmjs.com/package/cheerio")

```javascript
function showTitle (err, current) {
    const $ = current.$;
    console.log($("title").text());
})
s.plan("showTitle", requestPlan(showTitle));
```

为了更方便的提取数据，nodespider 扩充了jQ，提供了下面一些有用的工具函数：

**url**

获得选择节点（们）包含的 href 属性值，并自动转化相对路径为绝对路径。始终返回一个数组

```html
// current url: http://example.com/article/1.html

// html
<ul>
    <li class="pagination current"><a href="./1.html">1</a>
    <li class="pagination"><a href="./2.html">2</a>
    <li class="pagination"><a href="./3.html">3</a>
</ul>

// js
$(".pagination a").url();
// [
    "http://example.com/article/1.html",
    "http://example.com/article/2.html",
    "http://example.com/article/3.html",
]
```

### requestOpts
Nodejs [http.request options](http://nodejs.org/api/http.html#http_http_request_options_callback)

**可选，默认为`{encoding: null}`。注意，当设置项`toUtf8`为`true`时，`encoding`必须为`null`**

----------------

# download plan

```javascript
const { Spider, downloadPlan } = require("nodespider");
const s = new Spider();
s.plan("getImg", downloadPlan("./path/to/save"));
s.add("getImg", "http://www.just-an-example.com/image.jpg");
```

## options
```javascript
// 1)
downloadPlan(path)
// 2)
downloadPlan({ path, callback, requestOpts })
```

### path
保持下载文件的路径

### callback
**可选，默认在失败时打印错误信息**

当下载成功或失败，都将调动 callback 函数。调动时将传入三个参数： `err`、`current`、`spider`:
- `err` 如果下载成功，则为`null`
- `current` 当前任务对象
- - `filepath`  下载文件的保存路径
- - `url`   当前任务的url
- - `uid`    当前任务的uid
- - `planName`  任务指定的爬取计划名称
- - `hasRetried`    （不一定总是存在）当前任务已经重试的次数
- - `info`  该任务附带的信息对象。当使用方法 `add` 添加新任务时，可以为任务附带相关信息
- `spider`  当前爬虫实例

### requestOpts
**可选**

Nodejs [http.request options](http://nodejs.org/api/http.html#http_http_request_options_callback)


## 自定义文件保存名称
当使用`downloadPlan`时，将根据任务的附带信息`info`决定保存的文件名。

- 当`info`是对象时，如果`info.fileName`是字符串，则以`info.fileName`为保存文件名
- 其余情况，将自动转义链接以作为文件名

```javascript
s.add("downloadImg", "http://example.com/my.jpg");
// 保存文件的名称为 "example.com!my.jpg"

s.add("downloadImg", "http://example.com/example.png", { fileName: "example.png" });
// 保存文件名称为 "example.png"
```

## stream plan

// TODO:

```javascript
const { Spider, streamPlan } = require("nodespider");
const fs = require("fs");
const s = new Spider();
s.plan("pipeToLocal", streamPlan({
    callback: (err, current, s) => {
        const stream = current.stream;
        stream.pipe(fs.createWriteStream("./file"));
        stream.on("end", current.done());
        stream.on("error", current.done());
        stream.on("end", current.done());
    }
}));
s.add("pipeToLocal", "http://www.just-an-example.com");
```

### options
```javascript
// 1)
streamPlan(callback)

// 2)
streamPlan({
    callback,   // 必须。
    method, // 请求方法。默认为"GET"
    headers,    // 请求表头。默认为"{}"
    strict,   // （可选，默认为 false）当 strict 为 true，则仅当开发者调用current.next才完成本次并行任务
})
```

### callback

通过callback函数，你可以对返回数据流、爬取情况进行处理。无论请求成功还是失败，都会调用callback函数。

三个参数：
- `err` 如果请求成功，则为 `null`
- `current` 当前任务信息对象
- - `url`
- - `planName`
- - `hasRetried`
- - `info`
- - `stream`    返回数据流
- - `next`  重要！当设置项 strict 为 true，你需要通过在callback中调用`current.next`方法，以此告诉爬虫当前任务已经结束
- `spider`  当前爬虫实例

