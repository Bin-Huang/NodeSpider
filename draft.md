```javascript
const { actions, Spider, Pipes, Queues } = require('nodespider')

const s = new Spider({ forever: true })

const csv = new Pipe
  .to(decode)
  .to(trim)
  .to((data) => ({ ...data, name: 'ben' }))
  .to(Pipe.Csv('hello.csv'))
  .onError((e) => console.log(e))

const queue = new Queues.SimpleQueue({
  defaultUnique: true,
  defaultMaxRetries: 3,
  handleError(e, current, this) {
    // this.retry(current, { maxRetries: 3 })
  }
  handleOutofRetries(e, current, this) {
    console.log(e)
  }
})

const s = new Spider(opts)
  .to(actions.request('html'))
  .to(actions.toUtf8())
  .to(actions.loadJq)
  .to(handle)
  .to(async (current) => {
    const { $ } = current
    const url = $('#mp3_url').getUrl()
    await s.save('csv', { url })
  })
  .to(async (current) => {
    const urls = $('a').getUrls()
    queue.add(urls)
  })
  .listen(queue1)
  .listen(queue2)
```