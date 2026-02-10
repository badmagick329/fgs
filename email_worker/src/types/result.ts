export type Result<S, F> = Success<S, F> | Failure<S, F>;

export type Success<S, F> = {
  ok: true;
  data: S;
};
export type Failure<S, F> = {
  ok: false;
  error: F;
};
