import MultiCurrencyConverterScreen from './MultiCurrencyConverterScreen';

type Props = {
  onBack: () => void;
};

function CryptoConverterScreen({ onBack }: Props) {
  return (
    <MultiCurrencyConverterScreen
      title="Crypto Converter"
      headerIcon="bitcoin"
      allowedKinds={['crypto']}
      defaultBase={{ code: 'BTC', kind: 'crypto' }}
      defaultTargets={[
        { code: 'ETH', kind: 'crypto' },
        { code: 'USDT', kind: 'crypto' },
      ]}
      addButtonLabel="Add Coin"
      onBack={onBack}
    />
  );
}

export default CryptoConverterScreen;
