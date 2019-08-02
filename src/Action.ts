import Base, { IFunc } from './Base'

class Action<I, O> extends Base<I, O> {
  constructor(func: IFunc<I, O> | Action<I, O> = (d) => d as any, preAction?: Action<any, I>) {
    super(func, preAction)
  }

  public next<N>(action: Action<O, N> | IFunc<O, N>): Action<I, N> {
    return new Action(action as Action<any, N>, this)
  }

  public async exec(data: I) {
    return this.run(data)
  }

}

export default Action
