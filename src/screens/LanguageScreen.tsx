import { useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { LANGUAGES, LanguageOption } from '../i18n/languages';

const COLORS = {
  headerFrom: '#0B3D2E',
  headerTo: '#12594A',
  screenBg: '#FBFCFB',
  cardBorder: '#E7EBE9',
  cardBorderActive: '#1E8F5E',
  cardBg: '#FFFFFF',
  cardBgActive: '#EAF8F0',
  text: '#132420',
  radioInactive: '#C7D0CC',
  radioActive: '#1E8F5E',
};

type Props = {
  onContinue: (languageCode: string) => void;
};

function LanguageScreen({ onContinue }: Props) {
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const [selected, setSelected] = useState(i18n.language);

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={[COLORS.headerFrom, COLORS.headerTo]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <Text style={styles.headerTitle}>{t('language.title')}</Text>
        <TouchableOpacity
          style={styles.confirmButton}
          activeOpacity={0.8}
          onPress={() => onContinue(selected)}
        >
          <Icon name="check" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </LinearGradient>

      <FlatList
        data={LANGUAGES}
        keyExtractor={item => item.code}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <LanguageRow
            item={item}
            selected={item.code === selected}
            onPress={() => setSelected(item.code)}
          />
        )}
      />

      <View style={[styles.adSlot, { paddingBottom: insets.bottom }]} />
    </View>
  );
}

function LanguageRow({
  item,
  selected,
  onPress,
}: {
  item: LanguageOption;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.row, selected && styles.rowSelected]}
      activeOpacity={0.75}
      onPress={onPress}
    >
      <View style={styles.flagCircle}>
        <Text style={styles.flagEmoji}>{item.flag}</Text>
      </View>
      <Text style={styles.rowLabel}>{item.nativeName}</Text>
      <View style={[styles.radioOuter, selected && styles.radioOuterActive]}>
        {selected && <View style={styles.radioInner} />}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.screenBg,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  confirmButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderWidth: 1.5,
    borderColor: COLORS.cardBorder,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  rowSelected: {
    borderColor: COLORS.cardBorderActive,
    backgroundColor: COLORS.cardBgActive,
  },
  flagCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F4F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    overflow: 'hidden',
  },
  flagEmoji: {
    fontSize: 20,
  },
  rowLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.radioInactive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterActive: {
    borderColor: COLORS.radioActive,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.radioActive,
  },
  adSlot: {
    height: 60,
    backgroundColor: COLORS.screenBg,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
});

export default LanguageScreen;
