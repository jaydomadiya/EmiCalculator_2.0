/**
 * EMI Calculator
 *
 * @format
 */

import { useEffect, useState } from 'react';
import { StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import './src/i18n';
import { DEFAULT_LANGUAGE_CODE } from './src/i18n/languages';
import { getLoanType } from './src/data/loanTypes';
import { CalculationResult, LoanFormPatch, LoanFormState } from './src/types/loan';
import {
  calculateBulletRepayment,
  calculateEmi,
  calculateEmiWithMoratorium,
  calculateEmiWithProcessingFee,
  calculateMortgagePayment,
  tenureToMonths,
} from './src/utils/emi';
import HomeScreen from './src/screens/HomeScreen';
import LanguageScreen from './src/screens/LanguageScreen';
import LoanCalculatorScreen from './src/screens/LoanCalculatorScreen';
import LoanResultScreen from './src/screens/LoanResultScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';

SplashScreen.preventAutoHideAsync();

const LANGUAGE_STORAGE_KEY = 'emi_calculator_selected_language';

type Screen = 'loading' | 'onboarding' | 'language' | 'home' | 'calculator' | 'result';

function buildFormForLoanType(loanTypeKey: string): LoanFormState {
  const loanType = getLoanType(loanTypeKey);

  if (loanType.variant === 'mortgage') {
    const homePrice = loanType.defaultHomePrice ?? loanType.defaultAmount;
    const percent = loanType.defaultDownPaymentPercent ?? 20;
    return {
      variant: 'mortgage',
      loanTypeKey,
      homePrice: homePrice.toString(),
      downPaymentAmount: Math.round((homePrice * percent) / 100).toString(),
      downPaymentPercent: percent.toString(),
      tenureYears: loanType.defaultTenureValue.toString(),
      rate: loanType.defaultRate.toString(),
      propertyTax: (loanType.defaultPropertyTax ?? 0).toString(),
      pmi: (loanType.defaultPmi ?? 0).toString(),
      homeownersInsurance: (loanType.defaultHomeownersInsurance ?? 0).toString(),
      hoaFee: (loanType.defaultHoaFee ?? 0).toString(),
    };
  }

  return {
    variant: 'simple',
    loanTypeKey,
    amount: loanType.defaultAmount.toString(),
    rate: loanType.defaultRate.toString(),
    tenureValue: loanType.defaultTenureValue.toString(),
    tenureUnit: loanType.defaultTenureUnit,
    startDate: new Date(),
    processingFeePercent: loanType.supportsProcessingFee
      ? (loanType.defaultProcessingFeePercent ?? 0).toString()
      : undefined,
    repaymentType: loanType.supportsBulletRepayment
      ? loanType.defaultRepaymentType ?? 'bullet'
      : undefined,
    moratoriumMonths: loanType.supportsMoratorium
      ? (loanType.defaultMoratoriumMonths ?? 0).toString()
      : undefined,
  };
}

function App() {
  const { i18n } = useTranslation();
  const [screen, setScreen] = useState<Screen>('loading');
  const [loanForm, setLoanForm] = useState<LoanFormState | null>(null);
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);

  useEffect(() => {
    const bootstrap = async () => {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);

      if (savedLanguage) {
        await i18n.changeLanguage(savedLanguage);
        setScreen('home');
      } else {
        await i18n.changeLanguage(DEFAULT_LANGUAGE_CODE);
        setScreen('onboarding');
      }

      await SplashScreen.hideAsync();
    };

    bootstrap();
  }, [i18n]);

  const handleLanguageSelected = async (languageCode: string) => {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, languageCode);
    await i18n.changeLanguage(languageCode);
    setScreen('home');
  };

  const handleOpenLoanCalculator = (loanTypeKey: string) => {
    setLoanForm(buildFormForLoanType(loanTypeKey));
    setScreen('calculator');
  };

  const handleSelectLoanType = (loanTypeKey: string) => {
    setLoanForm(buildFormForLoanType(loanTypeKey));
  };

  const handleChangeLoanForm = (patch: LoanFormPatch) => {
    setLoanForm(current => (current ? ({ ...current, ...patch } as LoanFormState) : current));
  };

  const handleResetLoanForm = () => {
    if (loanForm) {
      setLoanForm(buildFormForLoanType(loanForm.loanTypeKey));
    }
  };

  const handleCalculate = () => {
    if (!loanForm) {
      return;
    }

    if (loanForm.variant === 'mortgage') {
      const mortgageResult = calculateMortgagePayment(
        Number(loanForm.homePrice),
        Number(loanForm.downPaymentAmount),
        Number(loanForm.rate),
        Number(loanForm.tenureYears),
        Number(loanForm.propertyTax),
        Number(loanForm.pmi),
        Number(loanForm.homeownersInsurance),
        Number(loanForm.hoaFee),
      );
      setCalculationResult({ variant: 'mortgage', data: mortgageResult });
    } else {
      const loanType = getLoanType(loanForm.loanTypeKey);
      const tenureMonths = tenureToMonths(Number(loanForm.tenureValue), loanForm.tenureUnit);
      const principal = Number(loanForm.amount);
      const rate = Number(loanForm.rate);

      if (loanType.supportsBulletRepayment && loanForm.repaymentType === 'bullet') {
        const bulletResult = calculateBulletRepayment(principal, rate, tenureMonths);
        setCalculationResult({ variant: 'bullet', data: bulletResult });
      } else if (loanType.supportsMoratorium) {
        const moratoriumMonths = Number(loanForm.moratoriumMonths ?? 0);
        const moratoriumResult = calculateEmiWithMoratorium(
          principal,
          rate,
          moratoriumMonths,
          tenureMonths,
        );
        setCalculationResult({ variant: 'moratorium', data: moratoriumResult });
      } else if (loanType.supportsProcessingFee) {
        const feePercent = Number(loanForm.processingFeePercent ?? 0);
        const feeResult = calculateEmiWithProcessingFee(principal, rate, tenureMonths, feePercent);
        setCalculationResult({ variant: 'simpleWithFee', data: feeResult });
      } else {
        const emiResult = calculateEmi(principal, rate, tenureMonths);
        setCalculationResult({ variant: 'simple', data: emiResult });
      }
    }

    setScreen('result');
  };

  const isOnboardingScreen = screen === 'onboarding';

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle={isOnboardingScreen ? 'dark-content' : 'light-content'}
        backgroundColor={isOnboardingScreen ? '#FBFCFB' : '#0B3D2E'}
      />
      {screen === 'onboarding' && (
        <OnboardingScreen onFinish={() => setScreen('language')} />
      )}
      {screen === 'language' && (
        <LanguageScreen onContinue={handleLanguageSelected} />
      )}
      {screen === 'home' && (
        <HomeScreen onOpenLoanCalculator={handleOpenLoanCalculator} />
      )}
      {screen === 'calculator' && loanForm && (
        <LoanCalculatorScreen
          form={loanForm}
          onChangeForm={handleChangeLoanForm}
          onSelectLoanType={handleSelectLoanType}
          onBack={() => setScreen('home')}
          onReset={handleResetLoanForm}
          onNext={handleCalculate}
        />
      )}
      {screen === 'result' && loanForm && calculationResult && (
        <LoanResultScreen
          form={loanForm}
          result={calculationResult}
          onBack={() => setScreen('calculator')}
          onDone={() => setScreen('home')}
        />
      )}
    </SafeAreaProvider>
  );
}

export default App;
