# pipeGenerator
nodespider自带了三种pipe发生器：`jsonPipe`, `csvPipe`和`txtPipe`，可以帮助开发者更方便地整理并保存提取到的数据。

```javascript
const {Spider, jsonPipe, txtPipe} = require("nodespider");
```

## jsonPipe(path, space)
数据将以json形式保存到本地

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| path | string | 保存文件路径 |
| space | number | （可选）缩进空格数 |

```javascript
const myJson = s.create(jsonPipe("path/to/my.json"));

s.save(myJson, {data: "some data", date: "2017.9"})

const myPlan = s.plan(function (err, current) {
    const $ = current.$;
    s.save(myJson, {
        name: $("#name").text(),
        desc: $("#desc").text(),
    })
})
```

## csvPipe(path, header)
数据将以txt表格形式写入（由制表符和换行符隔开）。
| 参数 | 类型 | 说明 |
| --- | --- | --- |
| path | string | 保存文件路径 |
| header | array | 表头元素数组 |

```javascript
const myCsvFile = n.create(txtPipe("path/to/my.csv", ["name", "description"]));

n.save(myCsvFile, {
    name: "some data",
    description: "example"
})
```

## txtPipe(path, header)
数据将以txt表格形式写入（由制表符和换行符隔开）。
| 参数 | 类型 | 说明 |
| --- | --- | --- |
| path | string | 保存文件路径 |
| header | array | 表头元素数组 |

```javascript
const txt = n.create(txtPipe("path/to/my.txt", ["name", "description"]));

n.save(txt, {
    name: "some data",
    description: "example"
})
```