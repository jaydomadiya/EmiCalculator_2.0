export function formatAmount(value: number): string {
  if (!Number.isFinite(value)) {
    return '0.00';
  }
  const isNegative = value < 0;
  const abs = Math.abs(value);

  let decimals = 2;
  if (abs > 0 && abs < 1) {
    // Show enough decimal places that small values (e.g. crypto prices under
    // $0.01, or a small fiat amount converted into BTC) never collapse to a
    // misleading "0.00" — expand precision until at least 3 significant
    // digits are visible, capped at 10 decimals.
    while (decimals < 10 && abs * 10 ** decimals < 100) {
      decimals += 1;
    }
  }

  const fixed = abs.toFixed(decimals);
  const isEffectivelyZero = Number(fixed) === 0;
  const [whole, rawDecimalPart = ''] = fixed.split('.');
  let decimalPart = rawDecimalPart;
  if (decimalPart.length > 2) {
    const trimmed = decimalPart.replace(/0+$/, '');
    decimalPart = trimmed.length < 2 ? trimmed.padEnd(2, '0') : trimmed;
  }

  const withThousands = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const sign = isNegative && !isEffectivelyZero ? '-' : '';
  return `${sign}${withThousands}.${decimalPart}`;
}

export function formatUpdatedAt(iso: string): string {
  if (!iso) {
    return '';
  }
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return iso;
  }
  return parsed.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
