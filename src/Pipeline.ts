export type IFunc = (data: any) => any

class Pipeline {
  static Trim: new () => Pipeline

  private prePipes: Pipeline[]
  private func: (data: any) => any
  constructor(func: IFunc | Pipeline = (d) => d, prePipe?: Pipeline) {
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

  public to(pipe: Pipeline | IFunc) {
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

class Trim extends Pipeline {
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
