export type IFunc<D extends { [x: string]: any }, R> = (data: D) => R | Promise<R>

class Action<D, R> {
  static Trim: new <T>() => Action<T, T>

  private preActions: Action<any, any>[]
  private func: (data: any) => any
  constructor(func: IFunc<D, R> | Action<D, R> = (d) => d as any, preAction?: Action<any, D>) {
    this.preActions = preAction ? [ preAction ] : []
    if (func instanceof Function) {
      this.func = func
    } else if (func instanceof Action) {
      this.preActions.push(func)
      this.func = (t) => t
    } else {
      throw new Error('invalid parameters')
    }
  }

  public next<N>(action: Action<R, N> | IFunc<R, N>): Action<R, N> {
    return new Action(action, this)
  }

  public async exec(task: any) {
    let t = task
    for (const action of this.preActions) {
      t = await action.exec(t)
    }
    return this.func(t)
  }

}

class Trim<T> extends Action<T, T> {
  constructor() {
    const convert = (data: any) => {
      for (const key of Object.keys(data)) {
        const value = data[key]
        if (typeof value === 'string') {
          data[key] = value.trim()
        }
      }
      return data
    }
    super(convert)
  }
}

Action.Trim = Trim

export default Action
