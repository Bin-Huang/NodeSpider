export type IFunc = (data: any) => any

class Pipeline {
  static Trim: new () => Pipeline

  private prePipes: Pipeline[]
  private func: (data: any) => any
  constructor(func: IFunc | Pipeline | (IFunc | Pipeline)[] = (d) => d) {
    if (func instanceof Function) {
      this.func = func
      this.prePipes = []
    } else if (func instanceof Pipeline) {
      this.func = (d) => d
      this.prePipes = [ func ]
    } else if (Array.isArray(func)) {
      this.func = (d) => d
      this.prePipes = func.map(raw => {
        if (raw instanceof Pipeline) {
          return raw
        } else if (raw instanceof Function) {
          return new Pipeline(raw)
        } else {
          throw new Error('Invalid parameters')
        }
      })
    }
  }

  public to(pipe: Pipeline | IFunc) {
    return new Pipeline([ this, pipe ])
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
