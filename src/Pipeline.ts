export type IFunc<D extends { [x: string]: any }, R> = (data: D) => R | Promise<R>

class Pipeline<D, R> {
  static Trim: new () => Pipeline<any, any>

  private prePipes: Pipeline<any, any>[]
  private func: (data: any) => any
  constructor(func: IFunc<D, R> | Pipeline<D, R> = (d) => d as any, prePipe?: Pipeline<any, D>) {
    this.prePipes = prePipe ? [ prePipe ] : []
    if (func instanceof Function) {
      this.func = func
    } else if (func instanceof Pipeline) {
      this.prePipes.push(func)
      this.func = (d) => d
    } else {
      throw new Error('invalid parameters')
    }
  }

  public to<N>(pipe: Pipeline<R, N> | IFunc<R, N>): Pipeline<R, N> {
    return new Pipeline(pipe, this)
  }

  public async save(data: any) {
    let d = data
    for (const pipe of this.prePipes) {
      d = await pipe.save(d)
    }
    return this.func(d)
  }

}

class Trim<D, R> extends Pipeline<D, R> {
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

Pipeline.Trim = Trim

export default Pipeline
