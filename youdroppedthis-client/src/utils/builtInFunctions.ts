export default {
  ifelse: (cond: boolean, _true: any, _false: any) => (cond ? _true : _false),
  not: (a: any) => !a,
  max: Math.max,
  min: Math.min,
  abs: Math.abs,
  round: Math.round,
  ceil: Math.ceil,
  floor: Math.floor,
  random: Math.random,
}
