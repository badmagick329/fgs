export interface IClock {
  now(): Date;
  nowMs(): number;
}
