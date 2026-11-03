import React, { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from '@/components/Themed';
import { useMeetingStore } from '@/store/meetingStore';
import {
  AVAILABLE_WHISPER_MODELS,
  AVAILABLE_SLM_MODELS,
} from '@/services/modelManagerService';
import { ToastNotification, ToastConfig } from '@/components/ToastNotification';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { TranscriptionProvider, AIModelProvider } from '@/types/meeting';

export default function SettingsScreen() {
  const theme = useColorScheme();
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();

  const { settings, updateSettings, loadDemoData, clearAllData } = useMeetingStore();

  const [toast, setToast] = useState<ToastConfig | null>(null);

  // Key inputs
  const [groqKeyInput, setGroqKeyInput] = useState(settings.groqApiKey || '');
  const [showGroqKey, setShowGroqKey] = useState(false);
  const [isTestingGroq, setIsTestingGroq] = useState(false);

  const [sarvamKeyInput, setSarvamKeyInput] = useState(settings.sarvamApiKey || '');
  const [showSarvamKey, setShowSarvamKey] = useState(false);
  const [isTestingSarvam, setIsTestingSarvam] = useState(false);

  // Save Groq key
  const handleSaveGroqKey = () => {
    updateSettings({ groqApiKey: groqKeyInput.trim() });
    setToast({
      type: 'success',
      title: 'Groq Key Saved',
      message: 'Groq API Key is stored and ready for high-speed transcription & notes.',
      duration: 3000,
    });
  };

  // Test Groq connection
  const handleTestGroq = async () => {
    const key = groqKeyInput.trim() || settings.groqApiKey;
    if (!key) {
      setToast({
        type: 'error',
        title: 'Missing Groq Key',
        message: 'Please paste your Groq API key first.',
        duration: 3000,
      });
      return;
    }

    setIsTestingGroq(true);
    try {
      const res = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { Authorization: `Bearer ${key}` },
      });
      if (res.ok) {
        setToast({
          type: 'success',
          title: 'Groq API Verified!',
          message: 'Connection successful. Whisper and Llama models are available.',
          duration: 3500,
        });
      } else {
        const text = await res.text();
        setToast({
          type: 'error',
          title: 'Groq Auth Failed',
          message: `Status ${res.status}: Invalid API Key or network issue.`,
          duration: 4000,
        });
      }
    } catch (err: any) {
      setToast({
        type: 'error',
        title: 'Connection Error',
        message: err?.message || 'Could not reach api.groq.com',
        duration: 4000,
      });
    } finally {
      setIsTestingGroq(false);
    }
  };

  // Save Sarvam key
  const handleSaveSarvamKey = () => {
    updateSettings({ sarvamApiKey: sarvamKeyInput.trim() });
    setToast({
      type: 'success',
      title: 'Sarvam Key Saved',
      message: 'Sarvam AI Subscription Key stored for Saaras STT and LLM.',
      duration: 3000,
    });
  };

  // Test Sarvam connection
  const handleTestSarvam = async () => {
    const key = sarvamKeyInput.trim() || settings.sarvamApiKey;
    if (!key) {
      setToast({
        type: 'error',
        title: 'Missing Sarvam Key',
        message: 'Please paste your Sarvam subscription key first.',
        duration: 3000,
      });
      return;
    }

    setIsTestingSarvam(true);
    try {
      // Test chat completion with minimal payload
      const res = await fetch('https://api.sarvam.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'api-subscription-key': key,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'sarvam-105b-conversations',
          messages: [{ role: 'user', content: 'hi' }],
          max_tokens: 5,
        }),
      });

      if (res.ok || res.status === 400) {
        // 200 or 400 means auth passed
        setToast({
          type: 'success',
          title: 'Sarvam API Verified!',
          message: 'Connection successful. Saaras STT and Sarvam-105B are ready.',
          duration: 3500,
        });
      } else {
        setToast({
          type: 'error',
          title: 'Sarvam Auth Failed',
          message: `Status ${res.status}: Check your subscription key.`,
          duration: 4000,
        });
      }
    } catch (err: any) {
      setToast({
        type: 'error',
        title: 'Connection Error',
        message: err?.message || 'Could not reach api.sarvam.ai',
        duration: 4000,
      });
    } finally {
      setIsTestingSarvam(false);
    }
  };

  // STT Provider toggle
  const handleSelectSttProvider = (provider: TranscriptionProvider) => {
    updateSettings({ transcriptionProvider: provider });
    setToast({
      type: 'info',
      title: 'STT Provider Selected',
      message:
        provider === 'groq'
          ? 'Groq Whisper selected for sub-second cloud transcription.'
          : provider === 'sarvam'
          ? 'Sarvam AI Saaras selected for multi-lingual Indian speech.'
          : '100% On-Device Whisper selected for offline local processing.',
      duration: 3000,
    });
  };

  // AI Model Provider toggle
  const handleSelectAiProvider = (provider: AIModelProvider) => {
    updateSettings({ aiModelProvider: provider });
    setToast({
      type: 'info',
      title: 'Note Provider Selected',
      message:
        provider === 'groq'
          ? 'Groq Llama 3.3 selected for state-of-the-art note synthesis.'
          : provider === 'sarvam'
          ? 'Sarvam 105B selected for deep conversational synthesis.'
          : 'Local SLM selected for on-device task extraction.',
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Settings & Models</Text>
        <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
          Configure Groq, Sarvam AI, and On-Device inference endpoints
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}>
        {/* Active Providers Overview Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="hardware-chip-outline" size={20} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>Active Processing Endpoints</Text>
          </View>

          {/* STT Selection Tabs */}
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
            1. Speech-to-Text Transcription Provider
          </Text>
          <View style={styles.providerRow}>
            {[
              { id: 'groq', label: 'Groq Whisper', icon: 'flash' },
              { id: 'sarvam', label: 'Sarvam AI', icon: 'globe' },
              { id: 'local', label: 'On-Device', icon: 'shield-checkmark' },
            ].map((p) => {
              const isSelected = settings.transcriptionProvider === p.id;
              return (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => handleSelectSttProvider(p.id as TranscriptionProvider)}
                  style={[
                    styles.providerTab,
                    {
                      backgroundColor: isSelected
                        ? colors.primaryContainer
                        : colors.surfaceContainerLow,
                      borderColor: isSelected ? colors.primary : colors.cardBorder,
                    },
                  ]}>
                  <Ionicons
                    name={p.icon as any}
                    size={14}
                    color={isSelected ? colors.primary : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.providerTabText,
                      { color: isSelected ? colors.primary : colors.text },
                    ]}>
                    {p.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* AI Note Selection Tabs */}
          <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginTop: 8 }]}>
            2. AI Meeting Note Synthesis Provider
          </Text>
          <View style={styles.providerRow}>
            {[
              { id: 'groq', label: 'Groq Llama 3.3', icon: 'flash' },
              { id: 'sarvam', label: 'Sarvam 105B', icon: 'globe' },
              { id: 'local', label: 'Local SLM', icon: 'shield-checkmark' },
            ].map((p) => {
              const isSelected = settings.aiModelProvider === p.id;
              return (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => handleSelectAiProvider(p.id as AIModelProvider)}
                  style={[
                    styles.providerTab,
                    {
                      backgroundColor: isSelected
                        ? colors.secondaryContainer
                        : colors.surfaceContainerLow,
                      borderColor: isSelected ? colors.secondary : colors.cardBorder,
                    },
                  ]}>
                  <Ionicons
                    name={p.icon as any}
                    size={14}
                    color={isSelected ? colors.secondary : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.providerTabText,
                      { color: isSelected ? colors.secondary : colors.text },
                    ]}>
                    {p.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 1. Groq API Configuration Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.providerLogoBg, { backgroundColor: '#F55036' }]}>
              <Text style={styles.providerLogoText}>G</Text>
            </View>
            <View style={styles.cardTitleCol}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Groq API Configuration</Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                Ultra-fast inference: Whisper-Large-V3 and Llama 3.3 70B (~500 tok/sec)
              </Text>
            </View>
          </View>

          {/* Groq API Key input */}
          <View style={styles.inputGroup}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Groq API Key</Text>
            <View
              style={[
                styles.keyInputRow,
                { backgroundColor: colors.surfaceContainerLow, borderColor: colors.cardBorder },
              ]}>
              <TextInput
                style={[styles.keyInput, { color: colors.text }]}
                placeholder="gsk_..."
                placeholderTextColor={colors.textSecondary}
                value={groqKeyInput}
                onChangeText={setGroqKeyInput}
                secureTextEntry={!showGroqKey}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowGroqKey(!showGroqKey)} style={styles.eyeBtn}>
                <Ionicons
                  name={showGroqKey ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.keyActionsRow}>
              <TouchableOpacity
                onPress={handleSaveGroqKey}
                style={[styles.smallActionBtn, { backgroundColor: colors.primary }]}>
                <Text style={[styles.smallActionBtnText, { color: colors.primaryText }]}>Save Key</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleTestGroq}
                disabled={isTestingGroq}
                style={[styles.testBtn, { borderColor: colors.border }]}>
                {isTestingGroq ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={14} color={colors.primary} />
                    <Text style={[styles.testBtnText, { color: colors.primary }]}>Test Groq Connection</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Groq Whisper Model Choice */}
          <View style={styles.inputGroup}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
              Groq Whisper STT Model
            </Text>
            <View style={styles.choiceChipsRow}>
              {[
                { id: 'whisper-large-v3-turbo', label: 'Whisper-Large-V3 Turbo (Recommended)' },
                { id: 'whisper-large-v3', label: 'Whisper-Large-V3 (Standard)' },
                { id: 'distil-whisper-large-v3-en', label: 'Distil-Whisper-Large (English)' },
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
          </View>

          {/* Groq LLM Model Choice */}
          <View style={styles.inputGroup}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
              Groq AI Reasoning Model
            </Text>
            <View style={styles.choiceChipsRow}>
              {[
                { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B (Recommended)' },
                { id: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B (Sub-second)' },
                { id: 'gemma2-9b-it', label: 'Gemma 2 9B Instruct' },
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
        </View>

        {/* 2. Sarvam AI Configuration Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.providerLogoBg, { backgroundColor: '#10B981' }]}>
              <Text style={styles.providerLogoText}>S</Text>
            </View>
            <View style={styles.cardTitleCol}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Sarvam AI Configuration</Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                Saaras Speech-to-Text & Sarvam-105B with deep multi-lingual Indian language support
              </Text>
            </View>
          </View>

          {/* Sarvam Subscription Key */}
          <View style={styles.inputGroup}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
              Sarvam API Subscription Key
            </Text>
            <View
              style={[
                styles.keyInputRow,
                { backgroundColor: colors.surfaceContainerLow, borderColor: colors.cardBorder },
              ]}>
              <TextInput
                style={[styles.keyInput, { color: colors.text }]}
                placeholder="sarvam_sub_key..."
                placeholderTextColor={colors.textSecondary}
                value={sarvamKeyInput}
                onChangeText={setSarvamKeyInput}
                secureTextEntry={!showSarvamKey}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowSarvamKey(!showSarvamKey)}
                style={styles.eyeBtn}>
                <Ionicons
                  name={showSarvamKey ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.keyActionsRow}>
              <TouchableOpacity
                onPress={handleSaveSarvamKey}
                style={[styles.smallActionBtn, { backgroundColor: colors.primary }]}>
                <Text style={[styles.smallActionBtnText, { color: colors.primaryText }]}>Save Key</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleTestSarvam}
                disabled={isTestingSarvam}
                style={[styles.testBtn, { borderColor: colors.border }]}>
                {isTestingSarvam ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={14} color={colors.primary} />
                    <Text style={[styles.testBtnText, { color: colors.primary }]}>Test Sarvam Connection</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Sarvam Saaras Model Choice */}
          <View style={styles.inputGroup}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
              Sarvam Saaras STT Model
            </Text>
            <View style={styles.choiceChipsRow}>
              {[
                { id: 'saaras:v4', label: 'Saaras v4 (Latest & Recommended)' },
                { id: 'saaras:v3', label: 'Saaras v3' },
              ].map((m) => {
                const isSelected = settings.sarvamSttModel === m.id;
                return (
                  <TouchableOpacity
                    key={m.id}
                    onPress={() => updateSettings({ sarvamSttModel: m.id as any })}
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
          </View>

          {/* Sarvam Language Selection */}
          <View style={styles.inputGroup}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
              Language Detection / Hint
            </Text>
            <View style={styles.languagePillsWrap}>
              {[
                { code: 'unknown', label: 'Auto-Detect' },
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

          {/* Sarvam LLM Model */}
          <View style={styles.inputGroup}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
              Sarvam AI Reasoning Model
            </Text>
            <View style={styles.choiceChipsRow}>
              {[
                { id: 'sarvam-105b', label: 'Sarvam-105B (Flagship Reasoning)' },
                { id: 'sarvam-105b-conversations', label: 'Sarvam-105B Conversations (Tuned)' },
              ].map((m) => {
                const isSelected = settings.sarvamLlmModel === m.id;
                return (
                  <TouchableOpacity
                    key={m.id}
                    onPress={() => updateSettings({ sarvamLlmModel: m.id as any })}
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
        </View>

        {/* 3. Local On-Device Fallback Models Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="phone-portrait-outline" size={20} color={colors.oliveText} />
            <View style={styles.cardTitleCol}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Local On-Device Models</Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                Offline whisper & SLM models used when local mode is chosen or when offline
              </Text>
            </View>
          </View>

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Local Whisper STT</Text>
          <View style={styles.choiceChipsRow}>
            {AVAILABLE_WHISPER_MODELS.map((model) => {
              const isSelected = settings.whisperModel === model.id;
              return (
                <TouchableOpacity
                  key={model.id}
                  onPress={() => updateSettings({ whisperModel: model.id as any })}
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
                    {model.name} ({model.formattedSize})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginTop: 8 }]}>
            Local SLM Model
          </Text>
          <View style={styles.choiceChipsRow}>
            {AVAILABLE_SLM_MODELS.map((model) => {
              const isSelected = settings.activeSlmModel === model.id;
              return (
                <TouchableOpacity
                  key={model.id}
                  onPress={() => updateSettings({ activeSlmModel: model.id })}
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
                    {model.name} ({model.formattedSize})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 4. Data Management Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Data Management</Text>
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
  providerLogoBg: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerLogoText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
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
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  providerRow: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: 'transparent',
  },
  providerTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  providerTabText: {
    fontSize: 12,
    fontWeight: '700',
  },
  inputGroup: {
    gap: 6,
    backgroundColor: 'transparent',
  },
  keyInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  keyInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 8,
  },
  eyeBtn: {
    padding: 6,
  },
  keyActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    backgroundColor: 'transparent',
  },
  smallActionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
  },
  smallActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  testBtnText: {
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
