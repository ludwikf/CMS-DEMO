import { ORDER_NUMBER_PREFIX } from "./branding";

const CODE_CHARS = "0123456789abcdefghijklmnopqrstuvwxyz";

export function randomOrderCode(length = 6): string {
  let s = "";
  for (let i = 0; i < length; i++) {
    s += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return s.toUpperCase();
}

export function buildOrderNumber(year = new Date().getFullYear()): {
  orderNumber: string;
  code: string;
} {
  const code = randomOrderCode();
  return {
    orderNumber: `${ORDER_NUMBER_PREFIX}/${year}/${code}`,
    code,
  };
}
