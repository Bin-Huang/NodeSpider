# Method

## plan(newPlan)

注册一个新的爬取计划

- **newPlan** 新的爬取计划对象，需要满足接口 `IPlan`

## add(planName, url, info)

添加新任务

- **planName** 指定爬取计划的名称。`string`
- **url** 需要添加的 url(s)，可以是一个字符串数组。`string | string[]`
- **info**  【可选】新添加任务的附带信息。`object`
- *return*  返回新添加任务的 uid 数组。`string[]`

## addU(planName, url, info)

添加新任务，但事先会自动过滤掉重复 url 以及链接池已经存在的 url

- **planName** 指定爬取计划的名称。`string`
- **url** 需要添加的 url(s)，可以是一个字符串数组。`string | string[]`
- **info**  【可选】新添加任务的附带信息。`object`
- *return*  返回新添加任务的 uid 数组（不包括被过滤任务）。`string[]`

## pipe(newPipe)

注册一个新的数据管道

- **newPipe** 新的数据管道对象，需要满足接口 `IPipe`

## save(pipeName, data)

通过数据管道，保存新数据

- **pipeName**  指定数据管道的名称。`string`
- **data**  需要保存的数据对象。`object`

## has(url)

检查一个链接是否存在于链接池，即是否已经添加过任务

- **url** 需要检查的 url。`string`
- *return*  如果已经存在，则返回 `true`；否则为 `false`

## filter(urls)

过滤一个链接列表，去除其中重复、或已经存在于链接池的 url

- **urls** 需要进行过滤的 url 列表。`string[]`
- *return*  通过过滤的结果。`string[]`

## pause()

暂停爬虫实例。暂停后爬虫将不再自动开始新的任务，通过调用方法 `active` 可以重新激活爬虫实例

## active()

激活爬虫实例。常用于暂停爬虫实例后的激活。激活后爬虫实例将自动开始新的任务。

## end()

终止爬虫实例。终止后，爬虫实例将不再开始新的任务，当正在进行的任务全部完成，爬虫实例将退出。