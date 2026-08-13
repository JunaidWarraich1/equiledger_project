// Hamilton / Hare-Niemeyer largest-remainder allocation.
// Splits `totalCents` (an integer) across entities with given `weights`
// so the parts sum EXACTLY back to totalCents — zero discrepancy.
// All math here is done in integer cents on purpose: never use floats
// for money, because IEEE 754 doubles cannot represent most decimal
// fractions exactly (that's the root cause of the $100/3 bug).
export function hamiltonAllocate(totalCents, weights) {
  const weightSum = weights.reduce((a, b) => a + b, 0);
  if (weightSum <= 0) return weights.map(() => 0);

  const exact = weights.map((w) => (totalCents * w) / weightSum);
  const floors = exact.map(Math.floor);
  const remainders = exact.map((e, i) => ({ i, frac: e - floors[i] }));

  let leftover = totalCents - floors.reduce((a, b) => a + b, 0);
  remainders.sort((a, b) => b.frac - a.frac);

  const result = [...floors];
  for (let k = 0; k < remainders.length && leftover > 0; k++) {
    result[remainders[k].i] += 1;
    leftover--;
  }
  return result;
}

// Naive float split — what most hand-rolled "split the bill" code does:
// divide the dollar amount directly and round each share to 2dp
// independently. Shown for comparison only.
export function naiveAllocate(totalDollars, weights) {
  const weightSum = weights.reduce((a, b) => a + b, 0);
  return weights.map((w) => {
    const share = (totalDollars * w) / weightSum;
    return Math.round(share * 100) / 100;
  });
}

export function sum(arr) {
  return arr.reduce((a, b) => a + b, 0);
}
