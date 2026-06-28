export function calculateProbability(yesPool: number, noPool: number) {
  if (yesPool === 0 && noPool === 0) {
    return { yes: 50.00, no: 50.00 };
  }
  const total = yesPool + noPool;
  if (total === 0) {
    return { yes: 50.00, no: 50.00 };
  }

  const yesRaw = (yesPool / total) * 100;
  const yes = Number(yesRaw.toFixed(2));
  // Ensure YES + NO = 100% at all times
  const no = Number((100 - yes).toFixed(2));

  return { yes, no };
}

export function calculateLiquidity(yesPool: number, noPool: number) {
  return yesPool + noPool;
}

export function calculateMarketPrice(yesPool: number, noPool: number) {
  const prob = calculateProbability(yesPool, noPool);
  return {
    yes: Math.round(prob.yes),
    no: Math.round(prob.no),
  };
}

export function calculatePayout(shares: number, price: number) {
  return shares * (price / 100);
}
