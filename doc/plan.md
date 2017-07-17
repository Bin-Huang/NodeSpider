# defaultPlan

## 用法

`defaultPlan`是 nodespider 的默认 plan 发生器，所以你可以直接传递设置对象到plan方法，甚至直接传递 callback 作为参数。

下面新建的三个plan是等价的
```javascript
const mydefaultPlan1 = n.plan((err, current) => {
    // your code
});

const mydefaultPlan2 = n.plan({
    pre: [preToUtf8, preLoadJq],
    callback: (err, current) => {
        // your code
    }
})

const mydefaultPlan3 = n.plan(defaultPlan({
    pre: [preToUtf8, preLoadJq],
    callback: (err, current) => {
        // your code
    }
}))
```
**NOTE**:   当你直接传递callback函数作为plan参数时，将默认加载两个预处理函数：`preToUtf8`和`preLoadJq`。

## 设置

```javascript
const myPlan = n.plan({
    request,
    pre,
    callback,
    info,
});
```

### request
 (可选). 即该爬取计划的网络请求设置，将决定执行该计划时爬虫如何发出网络请求。通过设置你可以伪造ip、模拟登录、设置cookies、伪造浏览器标示等。具体设置可见 [request文档](https://www.npmjs.com/package/request#requestoptions-callback)

### pre
(可选). 该爬取计划的预处理列表。当成功请求到网页信息后，将对网页信息进行预处理。nodespider自带两个实用预处理函数：`preToUtf8` 将网页内容自动转码为utf8格式，`preLoadJq` 对该网页内容加载JQ选择器(power by cheerio)

本质上，pre就是普通的callback函数。所以你可以提取callback中通用部分，作为预处理函数，实现代码复用及模块化开发。

### info
(可选). 对执行该计划的每一个任务附带信息对象。`info`将作为`current`成员(属性)传递给`rule`

### callback
(必须). 当报错或成功加载正文并预处理后，将调用callback。并传入两个参数`err`和`current`。

你可以使用callback对爬到的网页进行的操作，比如提取信息、添加新的链接到排队列表……

下面介绍一下 `current`。

#### current

`callback`函数在执行时将传入两个参数：`error`和`current`。其中`current`对象包含了很多当前任务的信息：

```javascript
const planA = n.plan({
    callback: (err, current) => {
        // your code
    },
})
```
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
- and more ...  以及可能的更多成员属性
 
 **NOTE**   值得注意的是，当前任务的指定计划，或者是特定设置中的预处理函数，往往会修改`current`中的成员属性，甚至添加更多的成员属性。

