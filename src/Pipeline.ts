import Base, { IFunc } from './Base'

class Pipeline<I, O> extends Base<I, O> {

  static Trim: new <T>() => Pipeline<T, T>

  constructor(func: IFunc<I, O> | Pipeline<I, O> = (d) => d as any, prePipe?: Pipeline<any, I>) {
    super(func, prePipe)
  }

  public to<N>(pipe: Pipeline<O, N> | IFunc<O, N>): Pipeline<I, N> {
    return new Pipeline(pipe as Pipeline<any, N>, this)
  }

  public async save(data: I) {
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
