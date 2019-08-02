import test from "ava";
import Action from '../src/Action'

test('Test Action processing sequence', async (t) => {
  let data = { s: '0' }
  const action = new Action((d: {s: string}) => ({ s: d.s + '1' }))
    .next((d) => ({ s: d.s + '2' }))
    .next(new Action((d) => ({ s: d.s + '3' })))
    .next(new Action((d) => ({ s: d.s + '4' })))
    .next(new Action(new Action((d) => ({ s: d.s + '5' }))))
    .next((d) => t.deepEqual(d, { s: '012345' }))
  await action.exec(data)
})

test('Test Action stateless', async (t) => {
  let data = { s: '0' }
  const pre = new Action((d: { s: string}) => ({ ...d, p0: true }))
  const pl = new Action(pre).next((d) => ({ ...d, p1: true }))
  pre.next((d) => ({ ...d, p3: true }))
  pl.next((d) => ({ ...d, p4: true }))
  t.deepEqual(await pl.exec(data), { ...data, p0: true, p1: true })
})

test('Test Action types', async (t) => {
  new Action((data: { num: number }) => ({ ...data, str: '100' }))
    .next(d => ({ sum: parseInt(d.str) + d.num }))
  t.is(true, true)  // Just check whether compile succeed
})

test('Test Action Trim', async (t) => {
  let data = { num: 0, str: '   demo value ', bool: true }
  const pl = new Action()
    .next(new Action.Trim())
    .next((d) => t.deepEqual(d, { num: 0, str: 'demo value', bool: true }))
  await pl.exec(data)
})
