export type Result<S, F> = Success<S> | Failure<F>;

export type Success<S> = {
  ok: true;
  data: S;
};
export type Failure<F> = {
  ok: false;
  error: F;
};
