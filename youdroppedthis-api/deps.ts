export { Application, Router, Context } from "oak";
export { oakCors } from "cors";
export { Client } from "postgres";
export * as bcrypt from "bcript";
export { create, verify, getNumericDate } from "djwt";
export { z } from "zod";

declare global {
  interface BigInt {
    toJSON(): number;
  }
}

BigInt.prototype.toJSON = function () {
  return Number(this);
};
