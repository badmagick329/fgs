export type Result<T> =
  | {
      ok: true
      data: T
    }
  | {
      ok: false
      error?: string
      errors?: ErrorRecord[]
    }

export type ErrorRecord = {
  message: string
  code?: string
  field?: string
  stack?: string | undefined
}
