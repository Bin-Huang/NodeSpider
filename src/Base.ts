export type IFunc<I extends { [x: string]: any }, O> = (data: I) => O | Promise<O>

class Base<I, O> {
  private preActions: Base<any, any>[]
  private func: IFunc<I, O>

  constructor(func: IFunc<I, O> | Base<I, O> = (d) => d as any, preAction?: Base<any, I>) {
    this.preActions = preAction ? [ preAction ] : []
    if (func instanceof Function) {
      this.func = func
    } else if (func instanceof Base) {
      this.preActions.push(func)
      this.func = (t) => t as any
    } else {
      throw new Error('invalid parameters')
    }
  }

  protected next<N>(action: Base<O, N> | IFunc<O, N>): Base<O, N> {
    return new Base(action, this)
  }

  protected async exec(task: I) {
    let t = task
    for (const action of this.preActions) {
      t = await action.exec(t)
    }
    return this.func(t)
  }

}

export default Base
