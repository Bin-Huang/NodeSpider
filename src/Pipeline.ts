import Base, { IFunc } from './Base'

class Pipeline<D, R> extends Base<D, R> {

  static Trim: new <T>() => Pipeline<T, T>

  constructor(func: IFunc<D, R> | Pipeline<D, R> = (d) => d as any, prePipe?: Pipeline<any, D>) {
    super(func, prePipe)
  }

  public to<N>(pipe: Pipeline<R, N> | IFunc<R, N>): Pipeline<R, N> {
    return new Pipeline(pipe, this)
  }

  public async save(data: D) {
    return this.exec(data)
  }

}

class Trim<T> extends Pipeline<T, T> {
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
