// Conversões de unidade XLM <-> stroops para uso interno
// 1 XLM = 10^7 stroops

export const STROOPS_PER_XLM = 10_000_000n;

export function xlmToStroops(xlm: string | number): bigint {
  const asString = typeof xlm === 'number' ? xlm.toString() : xlm;
  if (!/^\d+(\.\d{0,7})?$/.test(asString)) {
    throw new Error('Formato inválido: use até 7 casas decimais');
  }
  const [whole, frac = ''] = asString.split('.');
  const fracPadded = (frac + '0000000').slice(0,7);
  return BigInt(whole) * STROOPS_PER_XLM + BigInt(fracPadded);
}

export function stroopsToXlmString(stroops: bigint, options: {trim?: boolean} = {}): string {
  const negative = stroops < 0n;
  const abs = negative ? -stroops : stroops;
  const whole = abs / STROOPS_PER_XLM;
  const frac = abs % STROOPS_PER_XLM;
  let fracStr = frac.toString().padStart(7,'0');
  if (options.trim) {
    fracStr = fracStr.replace(/0+$/,'');
  }
  const base = fracStr.length ? `${whole.toString()}${fracStr ? '.'+fracStr : ''}` : whole.toString();
  return negative ? `-${base}` : base;
}

export function formatXlm(stroops: bigint, digits = 2): string {
  // Para exibir em UI com arredondamento simples
  const asNumber = Number(stroops) / Number(STROOPS_PER_XLM);
  return asNumber.toFixed(digits);
}
