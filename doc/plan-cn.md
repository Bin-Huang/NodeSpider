
nodespider 自带了三个计划模板，可以帮助你快速新建一个爬取计划:
- `defaultPlan` (默认的计划模板) 向站点发送网络请求，然后将接受到的 response 传递给 callbacks，以暴露返回正文给开发者处理
- `streamPlan`  根据url发送网络请求，并将返回的流(stream)直接通过 callback 暴露给开发者
- `downloadPlan`    下载url指向的文件到本地，开发者可以通过 callback 来处理下载成功与失败的情况

# default plan
```javascript
defaultPlan({
    name,
    callbacks,
    header,    // Optional, default: `{}`
    method, // Optional, default: `GET`
})
```
## callbacks
The functions to call one-by-one when fetched response body or throwed error in request.

NodeSpider supports promise and async function, so you can write some async code in your callback just wrap into promise and return, or write your callback as async function.

The three parameters will be passed in turn between each function. All changes to the three parameters will be passed to the next function

- `err` when there aren't error , it will be `null`
- `current` current task's information
- - `response`
- - `body`
- - `url`
- - `planName`
- - `hasRetried`
- - `info`
- `spider`  this spider instance

```javascript
let plan = defaultPlan({
    name: "myPlan",
    callbacks: [
        Spider.preToUtf8,
        Spider.preLoadJq,
        async (err, current) => await saveToSql(current.url),
        (err, current) => console.log(current.url)
    ],
    method: "GET",
    headers: {
        cookies: "this-is-my-cookies"
    }
});
s.add(plan);
s.queue("myPlan", "http://www.baidu.com");
```

# stream plan
```javascript
streamPlan({
    name,
    callback,
    header,    // Optional, default: `{}`
    method, // Optional, default: `GET`
})
```
## callback

当收到response stream，立即调用 callback 函数，并传入三个参数：

- `err` when there aren't error , it will be `null`
- `current` current task's information
- - `res`   the response stream
- - `url`
- - `planName`
- - `hasRetried`
- - `info`
- `spider`  this spider instance

```javascript
const write = fs.createWriteStream("./data.txt");
let plan = streamPlan({
    name: "myPlan",
    callback: (err, current, s) => {
        const res = current.res;
        res.pipe(write);
    }
});
s.add(plan);
s.queue("myPlan", "http://www.baidu.com");
```

# download plan
```javascript
downloadPlan({
    name,
    path,   // the path to save downloaded file
    callback,
    header,    // Optional, default: `{}`
    method, // Optional, default: `GET`
})
```
## callback

当成功下载后，或者遇到错误时，将调用 callback 函数，并传入三个参数：

- `err` when there aren't error , it will be `null`
- `current` current task's information
- - `url`
- - `planName`
- - `hasRetried`
- - `info`
- `spider`  this spider instance

```javascript
let plan = downloadPlan({
    name: "downloadImg",
    path: "./myFolder"
    callback: (err, current, s) => {
        if (err) return s.retry(current);
        console.log("Successfully downloaded from " + current.url);
    }
});
s.add(plan);
s.queue("downloadImg", "http://example.com/example.png");
```

## filename
当你使用`queue`添加一个url时，如果指定的是 download plan，爬虫将根据 `info` 为下载文件命名。

- 当`info`是字符串时，将直接以此命名
- 当`info`是一个对象时，如果存在`info.fileName`则以此命名
- 如果没有出现上述情况，将自动根据url命名

```javascript
s.queue("downloadImg", "http://example.com/example.png", "download.png");
s.queue("downloadImg", "http://example.com/example.png", {
    fileName: "download.png",
    data: "other attached information...",
});
s.queue("downloadImg", "http://example.com/example.png");
```
