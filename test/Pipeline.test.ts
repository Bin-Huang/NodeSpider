import test from "ava";
import Pipeline from '../src/Pipeline'

test('Test Pipeline scaffold', async (t) => {
  let data = { start: 0 }

  const pl = new Pipeline((d) => ({ ...d, p1: true }))
    .to((d) => ({ ...d, p1: true, p2: true }))
    .to(new Pipeline((d) => ({ ...d, p1: true, p3: true })))
    .to(new Pipeline((d) => ({ ...d, p1: true, p4: true })))
    .to(new Pipeline(new Pipeline((d) => ({ ...d, p1: true, p5: true }))))
    .to((d) => t.deepEqual(d, { ...data, p1: true, p2: true, p3: true, p4: true, p5: true }))

  await pl.save(data)
})

test('Test Pipeline Trim', async (t) => {
  let data = { num: 0, str: '   demo value ', bool: true }

  const pl = new Pipeline()
    .to(new Pipeline.Trim())
    .to((d) => t.deepEqual(d, { num: 0, str: 'demo value', bool: true }))

  await pl.save(data)
})
