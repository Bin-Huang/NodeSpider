import test from "ava";
import Pipe from '../src/Pipe'

test('Test Action processing sequence', async (t) => {
  let data = { s: '0' }
  const action = new Pipe((d: {s: string}) => ({ s: d.s + '1' }))
    .to((d) => ({ s: d.s + '2' }))
    .to(new Pipe((d) => ({ s: d.s + '3' })))
    .to(new Pipe((d) => ({ s: d.s + '4' })))
    .to(new Pipe(new Pipe((d) => ({ s: d.s + '5' }))))
    .to((d) => t.deepEqual(d, { s: '012345' }))
  await action.save(data)
})

test('Test Action stateless', async (t) => {
  let data = { s: '0' }
  const pre = new Pipe((d: { s: string }) => ({ ...d, p0: true }))
  const pl = new Pipe(pre).to((d) => ({ ...d, p1: true }))
  pre.to((d) => ({ ...d, p3: true }))
  pl.to((d) => ({ ...d, p4: true }))
  t.deepEqual(await pl.save(data), { ...data, p0: true, p1: true })
})

test('Test Action types', async (t) => {
  new Pipe((data: { num: number }) => ({ ...data, str: '100' }))
    .to(d => ({ sum: parseInt(d.str) + d.num }))
  t.is(true, true)  // Just check whether compile succeed
})

test('Test Action Trim', async (t) => {
  let data = { num: 0, str: '   demo value ', bool: true }
  const pl = new Pipe<any, any>()
    .to(new Pipe.Trim())
    .to((d) => t.deepEqual(d, { num: 0, str: 'demo value', bool: true }))
  await pl.save(data)
})
