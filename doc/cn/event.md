# 事件

通过监听爬虫实例的事件触发，你可以更好地了解爬虫实例的内部状态。

```javascript
const s = new Spider()
s
  .on("heartbeat", () => console.log("pitpat"))
  .on("statusChange", (current, pre) => console.log(`${pre} => ${current}`))
  .on("addTask", (task) => console.log("new task", task))

```

## statusChange

当爬虫的状态发生改变时，将触发 `statusChange` 事件。该事件被触发时，将有两个参数传入监听器：`status`（新的状态）, `preStatus`（上一状态）。

爬虫可能的状态：

- `active`  爬虫处于“活跃”状态。
- `vacant`  爬虫处于“空闲”状态，队列里没有待办任务，也没有正在进行的任务。爬虫会等待新的任务，当新的任务被添加，爬虫会自动进入 `active` 状态。
- `pause` 爬虫处于“暂停”阶段，不再执行新的任务。（通过调用 method `active` 可以再次启动爬虫）
- `end` 爬虫处于“终止”阶段，不再执行新的任务。当正在进行的任务全部结束后，爬虫将退出。

## addTask

当有新的任务添加到队列时，将触发 `addTask` 事件。该事件触发时，将传入参数 `task` 到监听器。

```
{
  uid,  // string。任务的id
  url,  // string。本次任务的请求链接
  planName, // string。本次任务指定计划的名称
  info, // object。任务附带的信息对象
}
```

## taskStart

当爬虫开始一个新任务时，将触发 `taskStart` 事件。该事件触发时，将有参数 `task` 传入到监听器： 

```
{
  uid,  // string。任务的id
  url,  // string。本次任务的请求链接
  planName, // string。本次任务指定计划的名称
  info, // object。任务附带的信息对象
}
```

## taskDone

当爬虫完成一个任务时，将触发 `taskDone` 事件。该事件触发时，将有参数 `task` 传入到监听器： 

```
{
  uid,  // string。任务的id
  url,  // string。本次任务的请求链接
  planName, // string。本次任务指定计划的名称
  info, // object。任务附带的信息对象
}
```

## queueEmpty

当任务队列为空，将触发 `queueEmpty` 事件

## heartbeat

在爬虫实例运行期间，将定时触发 `heartbeat` 事件。你可以通过修改爬虫设置的 `heartbeat` 来修改该事件的触发时间间隔。

```javascript
const s = new Spider({ heartbeat: 1000 })
s.on("heartbeat", () => console.log("pitpat"))  // 每 1 秒触发一次
```

## goodbye

当爬虫即将退出时，将触发 `goodbye` 事件