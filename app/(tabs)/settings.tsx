import React, { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from '@/components/Themed';
import { useMeetingStore } from '@/store/meetingStore';
import { ToastNotification, ToastConfig } from '@/components/ToastNotification';
import { hasGroqApiKey, hasSarvamApiKey } from '@/constants/ApiConfig';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { ProcessingEngine } from '@/types/meeting';

export default function SettingsScreen() {
  const theme = useColorScheme();
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();

  const { settings, updateSettings, loadDemoData, clearAllData } = useMeetingStore();
  const [toast, setToast] = useState<ToastConfig | null>(null);

  const isGroqConfigured = hasGroqApiKey();
  const isSarvamConfigured = hasSarvamApiKey();

  const handleSelectEngine = (engine: ProcessingEngine) => {
    updateSettings({ activeEngine: engine });
    setToast({
      type: 'info',
      title: engine === 'groq' ? 'Groq Turbo Engine Selected' : 'Sarvam AI Engine Selected',
      message:
        engine === 'groq'
          ? 'Fast inference with Groq Whisper Turbo & Llama 3.3 70B.'
          : 'Multilingual inference with Sarvam Saaras v4 & Sarvam 105B.',
      duration: 3000,
    });
  };

  const handleResetData = () => {
    Alert.alert(
      'Reset All Data?',
      'Are you sure you want to clear all recordings, notes, and meetings? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            clearAllData();
            setToast({
              type: 'info',
              title: 'Data Cleared',
              message: 'All recordings and meetings have been wiped.',
              duration: 3000,
            });
          },
        },
      ]
    );
  };

  const handleLoadDemo = () => {
    loadDemoData();
    setToast({
      type: 'success',
      title: 'Sample Data Loaded',
      message: 'Preloaded sample meetings and notes.',
      duration: 3000,
    });
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <ToastNotification toast={toast} onDismiss={() => setToast(null)} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Settings & Engine</Text>
        <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
          Manage AI note processing engine, speed, and language options
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}>
        {/* Active Engine Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="sparkles" size={20} color={colors.primary} />
            <View style={styles.cardTitleCol}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Active AI Engine</Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                Select the cloud backend that powers transcription & meeting intelligence
              </Text>
            </View>
          </View>

          <View style={styles.engineCardsCol}>
            {/* Groq Engine Option */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleSelectEngine('groq')}
              style={[
                styles.engineOptionCard,
                {
                  backgroundColor:
                    settings.activeEngine === 'groq'
                      ? colors.primaryContainer
                      : colors.surfaceContainerLow,
                  borderColor:
                    settings.activeEngine === 'groq' ? colors.primary : colors.cardBorder,
                },
              ]}>
              <View style={styles.engineTopRow}>
                <View style={styles.engineBadgeRow}>
                  <View style={[styles.engineIconCircle, { backgroundColor: '#F55036' }]}>
                    <Ionicons name="flash" size={14} color="#FFFFFF" />
                  </View>
                  <Text style={[styles.engineName, { color: colors.text }]}>
                    Groq Turbo Engine (Recommended)
                  </Text>
                </View>
                {settings.activeEngine === 'groq' && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                )}
              </View>

              <Text style={[styles.engineDescription, { color: colors.textSecondary }]}>
                Sub-second speech transcription with Whisper Large v3 Turbo, combined with Llama 3.3 70B for fast executive summaries and action items.
              </Text>

              <View style={styles.engineMetaRow}>
                <View style={[styles.featurePill, { backgroundColor: colors.surfaceContainer }]}>
                  <Text style={[styles.featurePillText, { color: colors.textSecondary }]}>
                    ~400ms Transcription
                  </Text>
                </View>
                <View style={[styles.featurePill, { backgroundColor: colors.surfaceContainer }]}>
                  <Text style={[styles.featurePillText, { color: colors.textSecondary }]}>
                    Llama 3.3 70B (~500 tok/s)
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Sarvam AI Engine Option */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleSelectEngine('sarvam')}
              style={[
                styles.engineOptionCard,
                {
                  backgroundColor:
                    settings.activeEngine === 'sarvam'
                      ? colors.secondaryContainer
                      : colors.surfaceContainerLow,
                  borderColor:
                    settings.activeEngine === 'sarvam' ? colors.secondary : colors.cardBorder,
                },
              ]}>
              <View style={styles.engineTopRow}>
                <View style={styles.engineBadgeRow}>
                  <View style={[styles.engineIconCircle, { backgroundColor: '#10B981' }]}>
                    <Ionicons name="globe" size={14} color="#FFFFFF" />
                  </View>
                  <Text style={[styles.engineName, { color: colors.text }]}>
                    Sarvam AI Multilingual Engine
                  </Text>
                </View>
                {settings.activeEngine === 'sarvam' && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.secondary} />
                )}
              </View>

              <Text style={[styles.engineDescription, { color: colors.textSecondary }]}>
                Specialized Saaras v4 speech recognition optimized for Indian English, Hindi, and 22+ regional languages, paired with Sarvam-105B reasoning.
              </Text>

              <View style={styles.engineMetaRow}>
                <View style={[styles.featurePill, { backgroundColor: colors.surfaceContainer }]}>
                  <Text style={[styles.featurePillText, { color: colors.textSecondary }]}>
                    Saaras v4 Multi-lingual
                  </Text>
                </View>
                <View style={[styles.featurePill, { backgroundColor: colors.surfaceContainer }]}>
                  <Text style={[styles.featurePillText, { color: colors.textSecondary }]}>
                    Sarvam 105B Reasoning
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Engine Fine-Tuning Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Model Profiles</Text>
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
            {settings.activeEngine === 'groq'
              ? 'Configure Groq high-speed model profile'
              : 'Configure Sarvam language detection & model profile'}
          </Text>

          {settings.activeEngine === 'groq' ? (
            <View style={styles.modelProfileGroup}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                Speech Recognition Profile
              </Text>
              <View style={styles.choiceChipsRow}>
                {[
                  { id: 'whisper-large-v3-turbo', label: 'Whisper-Large-V3 Turbo (Fastest)' },
                  { id: 'whisper-large-v3', label: 'Whisper-Large-V3 (Standard)' },
                ].map((m) => {
                  const isSelected = settings.groqWhisperModel === m.id;
                  return (
                    <TouchableOpacity
                      key={m.id}
                      onPress={() => updateSettings({ groqWhisperModel: m.id as any })}
                      style={[
                        styles.choiceChip,
                        {
                          backgroundColor: isSelected
                            ? colors.primaryContainer
                            : colors.surfaceContainerLow,
                          borderColor: isSelected ? colors.primary : colors.cardBorder,
                        },
                      ]}>
                      <Text
                        style={[
                          styles.choiceChipText,
                          { color: isSelected ? colors.primary : colors.text },
                        ]}>
                        {m.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginTop: 8 }]}>
                AI Reasoning Intelligence
              </Text>
              <View style={styles.choiceChipsRow}>
                {[
                  { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B (Frontier Quality)' },
                  { id: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B (Sub-second)' },
                ].map((m) => {
                  const isSelected = settings.groqLlmModel === m.id;
                  return (
                    <TouchableOpacity
                      key={m.id}
                      onPress={() => updateSettings({ groqLlmModel: m.id as any })}
                      style={[
                        styles.choiceChip,
                        {
                          backgroundColor: isSelected
                            ? colors.secondaryContainer
                            : colors.surfaceContainerLow,
                          borderColor: isSelected ? colors.secondary : colors.cardBorder,
                        },
                      ]}>
                      <Text
                        style={[
                          styles.choiceChipText,
                          { color: isSelected ? colors.secondary : colors.text },
                        ]}>
                        {m.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ) : (
            <View style={styles.modelProfileGroup}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                Speech Recognition Language
              </Text>
              <View style={styles.languagePillsWrap}>
                {[
                  { code: 'unknown', label: 'Auto-Detect Language' },
                  { code: 'en-IN', label: 'English (India)' },
                  { code: 'hi-IN', label: 'Hindi (हिंदी)' },
                  { code: 'ta-IN', label: 'Tamil (தமிழ்)' },
                  { code: 'te-IN', label: 'Telugu (తెలుగు)' },
                  { code: 'bn-IN', label: 'Bengali (বাংলা)' },
                  { code: 'mr-IN', label: 'Marathi (मराठी)' },
                ].map((lang) => {
                  const isSelected = (settings.sarvamLanguageCode || 'unknown') === lang.code;
                  return (
                    <TouchableOpacity
                      key={lang.code}
                      onPress={() => updateSettings({ sarvamLanguageCode: lang.code })}
                      style={[
                        styles.languagePill,
                        {
                          backgroundColor: isSelected
                            ? colors.secondaryContainer
                            : colors.surfaceContainerLow,
                          borderColor: isSelected ? colors.secondary : colors.cardBorder,
                        },
                      ]}>
                      <Text
                        style={[
                          styles.languagePillText,
                          { color: isSelected ? colors.secondary : colors.text },
                        ]}>
                        {lang.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        {/* Project API Configuration Status (Abstracted Developer Info) */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="key-outline" size={18} color={colors.textSecondary} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>Project Credentials</Text>
          </View>
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
            API keys are centrally managed in <Text style={{ fontWeight: '700' }}>constants/ApiConfig.ts</Text> or <Text style={{ fontWeight: '700' }}>.env.local</Text>.
          </Text>

          <View style={styles.credentialStatusList}>
            <View style={[styles.credentialStatusItem, { backgroundColor: colors.surfaceContainerLow }]}>
              <View style={styles.credentialStatusLeft}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: isGroqConfigured ? '#10B981' : '#F59E0B' },
                  ]}
                />
                <Text style={[styles.credentialName, { color: colors.text }]}>Groq API Key</Text>
              </View>
              <Text style={[styles.credentialStatusText, { color: colors.textSecondary }]}>
                {isGroqConfigured ? 'Configured in Project' : 'Ready for Key in ApiConfig.ts'}
              </Text>
            </View>

            <View style={[styles.credentialStatusItem, { backgroundColor: colors.surfaceContainerLow }]}>
              <View style={styles.credentialStatusLeft}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: isSarvamConfigured ? '#10B981' : '#F59E0B' },
                  ]}
                />
                <Text style={[styles.credentialName, { color: colors.text }]}>Sarvam AI Key</Text>
              </View>
              <Text style={[styles.credentialStatusText, { color: colors.textSecondary }]}>
                {isSarvamConfigured ? 'Configured in Project' : 'Ready for Key in ApiConfig.ts'}
              </Text>
            </View>
          </View>
        </View>

        {/* Data Management */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Data & Storage</Text>
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
            Load sample meeting notes or clear all stored data.
          </Text>

          <View style={styles.dataActionsRow}>
            <TouchableOpacity
              onPress={handleLoadDemo}
              style={[styles.dataBtn, { borderColor: colors.border }]}>
              <Ionicons name="refresh" size={16} color={colors.primary} />
              <Text style={[styles.dataBtnText, { color: colors.primary }]}>Load Sample Data</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleResetData}
              style={[styles.dataBtn, { borderColor: colors.danger }]}>
              <Ionicons name="trash" size={16} color={colors.danger} />
              <Text style={[styles.dataBtnText, { color: colors.danger }]}>Clear All Data</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 12,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'transparent',
  },
  cardTitleCol: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardSubtitle: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 1,
  },
  engineCardsCol: {
    gap: 10,
    marginTop: 4,
    backgroundColor: 'transparent',
  },
  engineOptionCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    gap: 8,
  },
  engineTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  engineBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'transparent',
  },
  engineIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  engineName: {
    fontSize: 14,
    fontWeight: '700',
  },
  engineDescription: {
    fontSize: 12,
    lineHeight: 17,
  },
  engineMetaRow: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: 'transparent',
    marginTop: 2,
  },
  featurePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  featurePillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  modelProfileGroup: {
    gap: 8,
    backgroundColor: 'transparent',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  choiceChipsRow: {
    gap: 6,
    backgroundColor: 'transparent',
  },
  choiceChip: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  choiceChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  languagePillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    backgroundColor: 'transparent',
  },
  languagePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  languagePillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  credentialStatusList: {
    gap: 6,
    marginTop: 2,
    backgroundColor: 'transparent',
  },
  credentialStatusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 10,
  },
  credentialStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'transparent',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  credentialName: {
    fontSize: 13,
    fontWeight: '600',
  },
  credentialStatusText: {
    fontSize: 11,
  },
  dataActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
    backgroundColor: 'transparent',
  },
  dataBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  dataBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
