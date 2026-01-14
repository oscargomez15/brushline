export const fmt = (n) =>
  new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(n || 0);

export const fmtMoney = (n) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(n || 0);

export const fmtDollar = (n) =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n || 0);

export const fmtHours = (n) => `${n || 0} hrs`;
