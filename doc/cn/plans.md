# Plan

## Plan Object

## 内置 Plan 模板

### requestPlan

```javascript
requestPlan({
  name,
  handle,
  catch,
  retries,
  toUtf8r,
  requestOpts,
})
```

**name**

计划的名称（唯一标识符）。`string`

**handle**

当成功获得 response 和 body，将执行 `handle` 函数。调用时，将有两个参数 `current` 和 `spider` 传给 `handle`：

- `current` 当前任务
  - `response`  [Node.js HTTP response stream](https://nodejs.org/api/http.html#http_class_http_incomingmessage)
  - `body`  返回 body。*string*
  - `url` 当前任务链接。*string*
  - `uid` 任务 uid。*string*
  - `planName`  当前任务指定的 plan 名称。*string*
  - `info`  当前任务附带的 info 对象。*object*
- `spider` 当前爬虫实例对象

```javascript
s.plan(requestPlan({
  name: "test",
  handle: (current, spider) => {
    console.log(current.body);
  }
}))
```

`handle` 函数可以是普通函数、async function 或者返回 `promise` 的函数

**toUtf8**（可选）

*boolean*。是否自动将 `current.body` 转码为 `utf8` 格式。默认为 `true`

**retries**（可选）

*number*。当任务失败时，最多重试多少次。默认为 `3`。NodeSpider 会在任务失败时自动进行重试。

**catch**（可选）

当任务失败，且重试次数超过重试次数限制后，将执行 `catch` 函数，这时有三个参数 `error`, `task`, `spider` 传入：

- `error` 报错 Error
- `task`  当前失败任务的信息
  - `url` 当前任务链接。*string*
  - `uid` 任务 uid。*string*
  - `planName`  当前任务指定的 plan 名称。*string*
  - `info`  当前任务附带的 info 对象。*object*
- `spider`  爬虫实例对象

`catch` 函数可以是普通函数、async function 或者返回 promise 的函数。如果 `catch` 未被设置，将默认抛出错误。

**requestOpts**（可选）

request 设置。具体设置项请看： [nodejs http.request options](https://nodejs.org/api/http.html#http_http_request_options_callback)

### jqPlan


```javascript
jqPlan({
  name,
  handle,
  catch,
  retries,
  toUtf8r,
  requestOpts,
})
```

**name**

计划的名称（唯一标识符）。`string`

**handle**

当成功获得 response 和 body，将执行 `handle` 函数。这时将传入三个参数 `$`, `current` 和 `spider`：

- `$` 可操作当前返回正文的 jQ选择器。（由 [cheerio](https://www.npmjs.com/package/cheerio) 提供支持）
- `current` 当前任务
  - `response`  [Node.js HTTP response stream](https://nodejs.org/api/http.html#http_class_http_incomingmessage)
  - `body`  返回 body。*string*
  - `url` 当前任务链接。*string*
  - `uid` 任务 uid。*string*
  - `planName`  当前任务指定的 plan 名称。*string*
  - `info`  当前任务附带的 info 对象。*object*
- `spider` 当前爬虫实例对象

```javascript
s.plan(jqPlan({
  name: "test",
  handle: ($, current, spider) => {
    console.log(current.url);
    console.log($("title").text());
  }
}))
```

`handle` 函数可以是普通函数、async function 或者返回 `promise` 的函数

**toUtf8**（可选）

*boolean*。是否自动将 `current.body` 转码为 `utf8` 格式。默认为 `true`

**retries**（可选）

*number*。当任务失败时，最多重试多少次。默认为 `3`。NodeSpider 会在任务失败时自动进行重试。

**catch**（可选）

当任务失败，且重试次数超过重试次数限制后，将执行 `catch` 函数，这时有三个参数 `error`, `task`, `spider` 传入：

- `error` 报错 Error
- `task`  当前失败任务的信息
  - `url` 当前任务链接。*string*
  - `uid` 任务 uid。*string*
  - `planName`  当前任务指定的 plan 名称。*string*
  - `info`  当前任务附带的 info 对象。*object*
- `spider`  爬虫实例对象

`catch` 函数可以是普通函数、async function 或者返回 promise 的函数。如果 `catch` 未被设置，将默认抛出错误。

**requestOpts**（可选）

request 设置。具体设置项请看： [nodejs http.request options](https://nodejs.org/api/http.html#http_http_request_options_callback)

### downloadPlan

```javascript
downloadPlan({
  name,
  path,
  retries,
  handle,
  catch,
  requestOpts,
})
```

**name**

计划的名称（唯一标识符）。`string`

**path**

下载文件的保存文件夹路径

**retries**（可选）

*number*。当任务失败时，最多重试多少次。默认为 `3`。NodeSpider 会在任务失败时自动进行重试。

**handle**（可选）

当下载成功完成时，将调用 `handle`，这时有两个参数 `current` 和 `spider` 传入：

- `current`
  - `filepath`  保存文件路径。*string*
  - `url` 当前任务链接。*string*
  - `uid` 任务 uid。*string*
  - `planName`  当前任务指定的 plan 名称。*string*
  - `info`  当前任务附带的 info 对象。*object*
- `spider`  当前爬虫实例对象

```javascript
s.plan(downloadPlan({
  name: "test",
  path: "./save/"
}))
```

`handle` 函数可以是普通函数、async function 或者返回 `promise` 的函数

**catch**（可选）

当任务失败，且重试次数超过重试次数限制后，将执行 `catch` 函数，这时有三个参数 `error`, `task`, `spider` 传入：

- `error` 报错 Error
- `task`  当前失败任务的信息
  - `url` 当前任务链接。*string*
  - `uid` 任务 uid。*string*
  - `planName`  当前任务指定的 plan 名称。*string*
  - `info`  当前任务附带的 info 对象。*object*
- `spider`  爬虫实例对象

`catch` 函数可以是普通函数、async function 或者返回 promise 的函数。如果 `catch` 未被设置，将默认抛出错误。

**requestOpts**（可选）

request 设置。具体设置项请看： [nodejs http.request options](https://nodejs.org/api/http.html#http_http_request_options_callback)