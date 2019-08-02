```javascript
const { Actions, Pipes, Queues } = require('nodespider')

const csv = new Pipe()
  .to(new Pipe.Decode())
  .to(new Pipe.Trim())
  .to(new Pipe((data) => ({ ...data, name: 'ben' })))
  .to((data) => ({ ...data, name: 'ben' }))
  .to(new Pipe.Csv('hello.csv', (e) => console.log(e)))

const queue = new Queues.SimpleQueue({
  allowDuplicate: true,
  defaultMaxRetries: 3,
  stillAlive: true, // refactor it
  onFailed(e, current, this) {
    // after retries
  }
})

const extractUrls = new Actions.Request('html'))
  .next(new Actions.Convert('utf8'))
  .next(new Actions.LoadJq())
  .next(new Actions(handle))
  .next(new Actions.Count())
  .next(async (current) => {
    const { $ } = current
    const url = $('#mp3_url').getUrl()
    await csv.save({ url })
  })
  .next(async (current) => {
    const urls = $('a').getUrls()
    queue.add(urls)
  })

extractUrls.exec({ uri: 'http://www.baidu.com' })

queue.handle(extractUrls, { concurrency: 100 })
```