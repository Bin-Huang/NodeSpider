export type IFunc<D extends { [x: string]: any }, R> = (data: D) => R | Promise<R>

class Base<D, R> {
  private preActions: Base<any, any>[]
  private func: (data: any) => any

  constructor(func: IFunc<D, R> | Base<D, R> = (d) => d as any, preAction?: Base<any, D>) {
    this.preActions = preAction ? [ preAction ] : []
    if (func instanceof Function) {
      this.func = func
    } else if (func instanceof Base) {
      this.preActions.push(func)
      this.func = (t) => t
    } else {
      throw new Error('invalid parameters')
    }
  }

  protected next<N>(action: Base<R, N> | IFunc<R, N>): Base<R, N> {
    return new Base(action, this)
  }

  protected async exec(task: D) {
    let t = task
    for (const action of this.preActions) {
      t = await action.exec(t)
    }
    return this.func(t)
  }

}

export default Base
