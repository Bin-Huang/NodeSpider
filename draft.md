
```javascript
const { Actions, Pipes, Queues } = require('nodespider')

const csv = new Pipe()
  .to(new Pipe.Decode())
  .to(new Pipe.Trim())
  .to(new Pipe((data) => ({ ...data, name: 'ben' })))
  .to((data) => ({ ...data, name: 'ben' }))
  .to(new Pipe.Csv('hello.csv'))
  .onError((e) => console.log(e))

const queue = new Queues.SimpleQueue({
  allowDuplicate: true,
  defaultMaxRetries: 3,
  stillAlive: true, // refactor it
  onFailed(e, current, this) {
    // this.retry(current, { maxRetries: 3 })
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

queue.handle(extractUrls, { concurrency: 100 })
```
