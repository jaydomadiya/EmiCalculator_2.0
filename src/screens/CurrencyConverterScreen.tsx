import MultiCurrencyConverterScreen from './MultiCurrencyConverterScreen';

type Props = {
  onBack: () => void;
};

function CurrencyConverterScreen({ onBack }: Props) {
  return (
    <MultiCurrencyConverterScreen
      title="Currency Converter"
      headerIcon="cash-multiple"
      allowedKinds={['fiat']}
      defaultBase={{ code: 'INR', kind: 'fiat' }}
      defaultTargets={[
        { code: 'USD', kind: 'fiat' },
        { code: 'EUR', kind: 'fiat' },
      ]}
      addButtonLabel="Add Currency"
      onBack={onBack}
    />
  );
}

export default CurrencyConverterScreen;
