# Pipe

搭建和使用一个数据管道，可以让你更加方便的保存从网页中提取的数据

```javascript
const { Spider, csvPipe, jqPlan } = require("nodespider")
const s = new Spider()

// 声明一个名为 person 的数据管
s.pipe(csvPipe({
  name: "person",
  path: "data/person.csv",
  items: ["name", "age"],
}))

// 通过这个管道保存数据
s.save("person", {
  name: "ben",
  age: 21,
})

// 在爬取计划中使用，从网页中保存数据
s.plan(jqPlan({
  name: "extract",
  hander: ($) => {
    s.save("person", {
      name: $("#name").text(),
      age: $("span.age").text(),
    })
  },
}))
s.add("extract", "http://just.for.test.com")
```

管道对象需要满足 `IPipe` 接口类型，如果你想要自定义管道可以参考。但更多情况下，你可以直接使用一些现成的 pipe 管道模板。NodeSpider 自带了三个常用的管道模板（见下文），同时你也可以在 npm 找到可能需要的 nodespider 三方开源管道模板。

## items 数据字段及预处理

声明数据管道时，需要提供管道数据字段。管道字段将限制管道能够保存哪些数据，同时声明对数据的预处理操作（可选）

当保存数据时，数据中不属于管道字段的数值将被过滤，管道字段缺省值将自动设为 null：

```javascript
s.pipe(csvPipe({
  name: "person",
  path: "data/person.csv",
  items: ["name", "age", "description"],  // 三个数据字段
}))

s.save("person", {
  name: "ben",
  age: 21,
  phone: "xxxxxxx", // phone 不存在于该管道字段，将被过滤
  // 字段 description 的缺省值默认为 null
})
```

items 不仅可以是一个字符串列表 `string[]`，还可以是一个对象（属性名为管道字段，属性值为对应字段的预处理函数）。当使用这个管道保存数据时，数据在保存前会先进行字段对应的预处理操作：

```javascript
s.pipe(csvPipe({
  name: "person",
  path: "data/person.csv",
  items: {
    // [字段]: [字段对应的预处理函数]
    name: (s) => s.trim(),
    age: parseInt,
    description: (s) => s.slice(0, 20),
  },
}))

s.save("person", {
  name: "ben  ",  // 预处理：去除空白符号 
  age: "21",  // 预处理：变成整数
  phone: "xxxxxxx",   // 不存在的数据字段。将被过滤
  // 字段 description 的缺省值为 null，不进行预处理操作
})
```

## Pipe 模板

nodespider自带了三种pipe发生器：`jsonPipe`, `csvPipe` 和 `txtPipe`，可以帮助开发者快速建立一个数据管道

### csvPipe

管道将与本地的某个 csv 文件对接。所有保存的数据将按照 csv 格式写入本地

```javascript
const { Spider, csvPipe } = require("nodespider")
const s = new Spider()
s.pipe(csvPipe({
  name, // 管道名称。string
  path, // 文件保存路径，文件不存在则新建，存在则覆盖。string
  items,  // 数据 items
}))
```

```javascript
const { Spider, csvPipe } = require("nodespider")

const s = new Spider()

s.pipe(csvPipe({
  name: "data",
  path: "./extract/data.csv",
  items: ["item1", "item2"],
}))

s.save({
  item1: "data1",
  item2: "data2",
})

```

### jsonPipe

管道将与本地的某个 json 文件对接。所有保存的数据将以 json 形式写入到本地

```javascript
const { jsonPipe } = require("nodespider")
jsonPipe({
  name, // 管道名称。string
  path, // 文件保存路径，文件不存在则新建，存在则覆盖。string
  items,  // 数据 items
  space,  // （可选）缩进空格数。number，默认 4
})
```

### txtPipe

管道将与本地的某个 txt 文件对接。所有保存的数据将以制表符与换行符隔开，并写入到本地。

```javascript
const { txtPipe } = require("nodespider")
txtPipe({
  name, // 管道名称。string
  path, // 文件保存路径，文件不存在则新建，存在则覆盖。string
  items,  // 数据 items
})
```