import Base, { IFunc } from './Base'

class Pipe<I, O> extends Base<I, O> {

  static Trim: new <T>() => Pipe<T, T>

  constructor(func: IFunc<I, O> | Pipe<I, O> = (d) => d as any, prePipe?: Pipe<any, I>) {
    super(func, prePipe)
  }

  public to<N>(pipe: Pipe<O, N> | IFunc<O, N>): Pipe<I, N> {
    return new Pipe(pipe as Pipe<any, N>, this)
  }

  public async save(data: I) {
    return this.run(data)
  }

}

class Trim<T> extends Pipe<T, T> {
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

Pipe.Trim = Trim

export default Pipe
