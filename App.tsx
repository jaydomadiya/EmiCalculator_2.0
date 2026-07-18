/**
 * EMI Calculator
 *
 * @format
 */

import { useEffect, useRef, useState } from 'react';
import { BackHandler, StatusBar, StyleSheet, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import mobileAds from 'react-native-google-mobile-ads';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
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
import CryptoConverterScreen from './src/screens/CryptoConverterScreen';
import ChartScreen from './src/screens/ChartScreen';
import CurrencyConverterScreen from './src/screens/CurrencyConverterScreen';
import CurrencyListScreen from './src/screens/CurrencyListScreen';
import CustomRateScreen from './src/screens/CustomRateScreen';
import HomeScreen, { ConverterTool } from './src/screens/HomeScreen';
import HomeAffordabilityScreen from './src/screens/HomeAffordabilityScreen';
import InvestmentCalculatorScreen from './src/screens/InvestmentCalculatorScreen';
import LanguageScreen from './src/screens/LanguageScreen';
import LoanAnalysisScreen from './src/screens/LoanAnalysisScreen';
import LoanCalculatorScreen from './src/screens/LoanCalculatorScreen';
import LoanComparisonScreen from './src/screens/LoanComparisonScreen';
import LoanComparisonResultScreen from './src/screens/LoanComparisonResultScreen';
import LoanResultScreen from './src/screens/LoanResultScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import OtherCalculatorScreen from './src/screens/OtherCalculatorScreen';
import SavingsGoalScreen from './src/screens/SavingsGoalScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { THEME } from './src/theme/colors';
import { LoanComparisonResult } from './src/types/loanComparison';
import { InvestmentTool } from './src/types/investment';
import { OtherCalculatorTool } from './src/types/otherCalculator';
import { AdsProvider, useAds } from './src/ads/AdsProvider';
import AdBanner from './src/ads/AdBanner';

SplashScreen.preventAutoHideAsync();

const LANGUAGE_STORAGE_KEY = 'emi_calculator_selected_language';

type Screen =
  | 'loading'
  | 'onboarding'
  | 'language'
  | 'home'
  | 'calculator'
  | 'result'
  | 'currencyConverter'
  | 'cryptoConverter'
  | 'customRate'
  | 'currencyList'
  | 'chart'
  | 'settings'
  | 'settingsLanguage'
  | 'loanComparison'
  | 'loanComparisonResult'
  | 'loanAnalysis'
  | 'homeAffordability'
  | 'savingsGoal'
  | 'investmentCalculator'
  | 'otherCalculator';

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

// Screens that must NOT get the global bottom banner: setup/blank screens, and
// screens that already render their own banner (home, loan calculator = category,
// loan result = article). Every other screen gets a bottom banner ("sari screen").
const NO_FOOTER_BANNER_SCREENS = [
  'loading',
  'onboarding',
  'language',
  'settingsLanguage',
  'home',
  'calculator',
  'result',
];

function AppContent() {
  const { i18n } = useTranslation();
  const { registerInteraction } = useAds();
  const insets = useSafeAreaInsets();
  const didBootstrap = useRef(false);
  const [screen, setScreen] = useState<Screen>('loading');
  const [loanForm, setLoanForm] = useState<LoanFormState | null>(null);
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);
  const [loanComparisonResult, setLoanComparisonResult] =
    useState<LoanComparisonResult | null>(null);
  const [investmentTool, setInvestmentTool] = useState<InvestmentTool>('fixedDeposit');
  const [otherCalculatorTool, setOtherCalculatorTool] =
    useState<OtherCalculatorTool>('creditCardPayoff');

  useEffect(() => {
    const bootstrap = async () => {
      if (didBootstrap.current) {
        return;
      }
      didBootstrap.current = true;

      mobileAds()
        .initialize()
        .catch(() => undefined);

      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);

      if (savedLanguage) {
        await i18n.changeLanguage(savedLanguage);
      } else {
        await i18n.changeLanguage(DEFAULT_LANGUAGE_CODE);
      }
      setScreen('onboarding');

      await SplashScreen.hideAsync();
    };

    bootstrap();
  }, [i18n]);

  useEffect(() => {
    const handleHardwareBack = () => {
      const exitScreens = ['home', 'onboarding', 'language', 'loading'];
      if (!exitScreens.includes(screen)) {
        registerInteraction('back');
      }
      switch (screen) {
        case 'result':
          setScreen('calculator');
          return true;
        case 'loanComparisonResult':
          setScreen('loanComparison');
          return true;
        case 'calculator':
        case 'currencyConverter':
        case 'cryptoConverter':
        case 'customRate':
        case 'currencyList':
        case 'chart':
        case 'settings':
        case 'loanComparison':
        case 'loanAnalysis':
        case 'homeAffordability':
        case 'savingsGoal':
        case 'investmentCalculator':
        case 'otherCalculator':
          setScreen('home');
          return true;
        case 'settingsLanguage':
          setScreen('settings');
          return true;
        default:
          // On 'home', 'onboarding', 'language', and 'loading' there is no
          // in-app previous step, so let the OS handle it (exits the app).
          return false;
      }
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', handleHardwareBack);
    return () => subscription.remove();
  }, [screen, registerInteraction]);

  const handleLanguageSelected = async (languageCode: string) => {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, languageCode);
    await i18n.changeLanguage(languageCode);
    setScreen('home');
  };

  const handleOpenLoanCalculator = (loanTypeKey: string) => {
    registerInteraction('click');
    setLoanForm(buildFormForLoanType(loanTypeKey));
    setScreen('calculator');
  };

  const handleOpenConverterTool = (tool: ConverterTool) => {
    registerInteraction('click');
    if (tool === 'loanComparison') {
      setLoanComparisonResult(null);
    }
    if (
      tool === 'fixedDeposit' ||
      tool === 'recurringDeposit' ||
      tool === 'sipCalculator' ||
      tool === 'returnOnInvestment'
    ) {
      setInvestmentTool(tool);
      setScreen('investmentCalculator');
      return;
    }
    if (
      tool === 'creditCardPayoff' ||
      tool === 'creditCardMinPayment' ||
      tool === 'breakEvenSellPrice' ||
      tool === 'compoundInterest'
    ) {
      setOtherCalculatorTool(tool);
      setScreen('otherCalculator');
      return;
    }
    setScreen(tool);
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

    registerInteraction('click');

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
  const showFooterBanner = !NO_FOOTER_BANNER_SCREENS.includes(screen);

  return (
    <View style={styles.appRoot}>
      <StatusBar
        barStyle={isOnboardingScreen ? 'dark-content' : 'light-content'}
        backgroundColor={isOnboardingScreen ? THEME.screenBg : THEME.headerFrom}
      />
      {screen === 'onboarding' && (
        <OnboardingScreen onFinish={() => setScreen('language')} />
      )}
      {screen === 'language' && (
        <LanguageScreen onContinue={handleLanguageSelected} />
      )}
      {screen === 'settingsLanguage' && (
        <LanguageScreen
          onBack={() => setScreen('settings')}
          onContinue={async languageCode => {
            await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, languageCode);
            await i18n.changeLanguage(languageCode);
            setScreen('settings');
          }}
        />
      )}
      {screen === 'home' && (
        <HomeScreen
          onOpenLoanCalculator={handleOpenLoanCalculator}
          onOpenConverterTool={handleOpenConverterTool}
        />
      )}
      {screen === 'currencyConverter' && (
        <CurrencyConverterScreen onBack={() => setScreen('home')} />
      )}
      {screen === 'cryptoConverter' && (
        <CryptoConverterScreen onBack={() => setScreen('home')} />
      )}
      {screen === 'customRate' && <CustomRateScreen onBack={() => setScreen('home')} />}
      {screen === 'currencyList' && (
        <CurrencyListScreen onBack={() => setScreen('home')} />
      )}
      {screen === 'chart' && (
        <ChartScreen
          onBackHome={() => setScreen('home')}
          onOpenConvert={() => setScreen('currencyConverter')}
          onOpenCalculator={() => handleOpenLoanCalculator('personalLoan')}
          onOpenSettings={() => setScreen('settings')}
        />
      )}
      {screen === 'settings' && (
        <SettingsScreen
          onBackHome={() => setScreen('home')}
          onOpenLanguage={() => setScreen('settingsLanguage')}
          onOpenConvert={() => setScreen('currencyConverter')}
          onOpenChart={() => setScreen('chart')}
          onOpenCalculator={() => handleOpenLoanCalculator('personalLoan')}
        />
      )}
      {screen === 'loanComparison' && (
        <LoanComparisonScreen
          onBack={() => setScreen('home')}
          onCalculate={result => {
            setLoanComparisonResult(result);
            setScreen('loanComparisonResult');
          }}
        />
      )}
      {screen === 'loanComparisonResult' && loanComparisonResult && (
        <LoanComparisonResultScreen
          result={loanComparisonResult}
          onBack={() => setScreen('loanComparison')}
          onDone={() => setScreen('home')}
        />
      )}
      {screen === 'loanAnalysis' && (
        <LoanAnalysisScreen onBack={() => setScreen('home')} />
      )}
      {screen === 'homeAffordability' && (
        <HomeAffordabilityScreen onBack={() => setScreen('home')} />
      )}
      {screen === 'savingsGoal' && (
        <SavingsGoalScreen onBack={() => setScreen('home')} />
      )}
      {screen === 'investmentCalculator' && (
        <InvestmentCalculatorScreen
          tool={investmentTool}
          onBack={() => setScreen('home')}
        />
      )}
      {screen === 'otherCalculator' && (
        <OtherCalculatorScreen
          tool={otherCalculatorTool}
          onBack={() => setScreen('home')}
        />
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
      {showFooterBanner && (
        <View style={[styles.footerBanner, { paddingBottom: insets.bottom }]}>
          <AdBanner placement="tools" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  appRoot: {
    flex: 1,
  },
  footerBanner: {
    backgroundColor: THEME.cardBg,
    borderTopWidth: 1,
    borderTopColor: THEME.border,
  },
});

function App() {
  return (
    <SafeAreaProvider>
      <AdsProvider>
        <AppContent />
      </AdsProvider>
    </SafeAreaProvider>
  );
}

export default App;
