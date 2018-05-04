# Option

当新建爬虫实例时，你还可以配置爬虫实例的设置项。

所有设置项均有默认值，所以你可以直接使用默认配置：

```javascript
const s = new Spider()
```

或者修改部分配置，其他使用默认：

```javascript
const s = new Spider({
  concurrency: 10
})
```

下面是所有可选的 Spider 设置项

## concurrency

最大异步任务并发数，即爬虫最多可以同时执行多少个爬取任务。默认为 `20`。

## heartbeat

爬虫实例的“心跳间隔”，即自动触发 `heartbeat` 事件的时间间隔。单位为毫秒，默认为 `2000`。

## genUUID

新任务的 uuid 发生器函数。默认为 [uuid](https://www.npmjs.com/package/uuid)

## stillAlive

是否保持爬虫实例的存活，即使爬虫一直处于空闲状态。默认为 `false`。

当为 `false` 时，当爬虫处于空闲状态（任务队列为空，且没有正在进行的异步任务）时，将自动进入终止阶段并自动退出。

当为 `true` 时，即使爬虫一直处于空闲阶段，爬虫实例也不会自动退出，但可以通过调用 method `end` 手动退出。

## queue

任务队列 Class，需要满足接口 `IQueue`。默认为 Nodespider 内置队列（将所有任务以链表的形式保存到内存中）

## pool

链接池 Class，用来保存添加过的链接。需要满足接口 `IPool`。默认为 `Set`