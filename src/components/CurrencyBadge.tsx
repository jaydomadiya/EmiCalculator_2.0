import { StyleSheet, Text, View } from 'react-native';
import { getCryptoBadgeColor, getCryptoMeta } from '../data/cryptoCurrencies';
import { getCurrencyMeta } from '../data/currencies';
import { CurrencySelection } from '../utils/conversion';

export function getSelectionMeta(selection: CurrencySelection): { code: string; name: string } {
  if (selection.kind === 'fiat') {
    return getCurrencyMeta(selection.code);
  }
  const crypto = getCryptoMeta(selection.code);
  return { code: crypto.symbol, name: crypto.name };
}

export function CurrencyBadge({
  selection,
  size = 22,
}: {
  selection: CurrencySelection;
  size?: number;
}) {
  if (selection.kind === 'fiat') {
    return <Text style={{ fontSize: size }}>{getCurrencyMeta(selection.code).flag}</Text>;
  }
  const color = getCryptoBadgeColor(selection.code);
  return (
    <View
      style={[
        styles.badge,
        { width: size + 4, height: size + 4, borderRadius: (size + 4) / 2, backgroundColor: color },
      ]}
    >
      <Text style={[styles.badgeText, { fontSize: size * 0.42 }]}>{selection.code.slice(0, 2)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
