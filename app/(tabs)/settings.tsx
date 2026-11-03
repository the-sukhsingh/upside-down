import React, { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
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

export default function SettingsScreen() {
  const theme = useColorScheme();
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();

  const { settings, updateSettings, loadDemoData, clearAllData } = useMeetingStore();

  const [toast, setToast] = useState<ToastConfig | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState(settings.cloudApiKey || '');
  const [showApiKey, setShowApiKey] = useState(false);

  const handleSaveApiKey = () => {
    updateSettings({ cloudApiKey: apiKeyInput.trim() });
    setToast({
      type: 'success',
      title: 'Settings Saved',
      message: 'Cloud API key has been stored.',
      duration: 3000,
    });
  };

  const handleToggleEngine = (isCloud: boolean) => {
    updateSettings({ engineMode: isCloud ? 'cloud' : 'local' });
    setToast({
      type: 'info',
      title: isCloud ? 'Cloud Mode Enabled' : '100% On-Device Mode Active',
      message: isCloud
        ? 'Uses Gemini API for higher accuracy when network is available.'
        : 'Zero data fetching. Complete privacy and local offline synthesis.',
      duration: 3500,
    });
  };

  const handleSelectWhisperModel = (id: any) => {
    updateSettings({ whisperModel: id });
    setToast({
      type: 'success',
      title: 'STT Model Selected',
      message: `Active model: ${id}`,
      duration: 2500,
    });
  };

  const handleSelectSLMModel = (id: string) => {
    updateSettings({ activeSlmModel: id });
    setToast({
      type: 'success',
      title: 'AI Note Model Selected',
      message: `Active model: ${id}`,
      duration: 2500,
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Settings & Privacy</Text>
        <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
          Configure transcription engines, local AI models, and privacy modes
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}>
        {/* Engine Mode Section */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Inference Engine Mode</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Toggle between 100% on-device private processing and Cloud API.
          </Text>

          <View style={[styles.toggleRow, { backgroundColor: colors.surfaceContainerLow }]}>
            <View style={styles.toggleLeft}>
              <Ionicons
                name={settings.engineMode === 'local' ? 'shield-checkmark' : 'cloud-outline'}
                size={22}
                color={settings.engineMode === 'local' ? colors.oliveText : colors.primary}
              />
              <View style={styles.toggleTextCol}>
                <Text style={[styles.toggleTitle, { color: colors.text }]}>
                  {settings.engineMode === 'local' ? '100% On-Device (Local)' : 'Cloud API (Gemini)'}
                </Text>
                <Text style={[styles.toggleDescription, { color: colors.textSecondary }]}>
                  {settings.engineMode === 'local'
                    ? 'Zero data leaves your device. Recordings & notes are processed offline.'
                    : 'Transcripts are processed using Gemini API.'}
                </Text>
              </View>
            </View>
            <Switch
              value={settings.engineMode === 'cloud'}
              onValueChange={handleToggleEngine}
              trackColor={{ false: colors.oliveLight, true: colors.primaryContainer }}
              thumbColor={settings.engineMode === 'cloud' ? colors.primary : colors.olive}
            />
          </View>

          {/* Cloud API Key input if Cloud is enabled */}
          {settings.engineMode === 'cloud' && (
            <View style={styles.apiKeyBox}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Gemini API Key</Text>
              <View
                style={[
                  styles.apiKeyInputRow,
                  { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border },
                ]}>
                <TextInput
                  style={[styles.apiKeyInput, { color: colors.text }]}
                  placeholder="AIzaSy..."
                  placeholderTextColor={colors.textSecondary}
                  value={apiKeyInput}
                  onChangeText={setApiKeyInput}
                  secureTextEntry={!showApiKey}
                />
                <TouchableOpacity onPress={() => setShowApiKey(!showApiKey)}>
                  <Ionicons
                    name={showApiKey ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                onPress={handleSaveApiKey}
                style={[styles.saveKeyBtn, { backgroundColor: colors.primary }]}>
                <Text style={[styles.saveKeyBtnText, { color: colors.primaryText }]}>Save API Key</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Speech-to-Text Model Selection */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Speech-to-Text Model</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Whisper quantization models for post-recording speech transcription.
          </Text>

          <View style={styles.modelsList}>
            {AVAILABLE_WHISPER_MODELS.map((model) => {
              const isSelected = settings.whisperModel === model.id;
              return (
                <TouchableOpacity
                  key={model.id}
                  onPress={() => handleSelectWhisperModel(model.id)}
                  style={[
                    styles.modelOption,
                    {
                      backgroundColor: isSelected
                        ? colors.primaryContainer
                        : colors.surfaceContainerLow,
                      borderColor: isSelected ? colors.primary : colors.cardBorder,
                    },
                  ]}>
                  <View style={styles.modelHeaderRow}>
                    <Text
                      style={[
                        styles.modelName,
                        { color: isSelected ? colors.primary : colors.text },
                      ]}>
                      {model.name}
                    </Text>
                    <View style={[styles.modelBadge, { backgroundColor: colors.surfaceContainer }]}>
                      <Text style={[styles.modelBadgeText, { color: colors.textSecondary }]}>
                        {model.formattedSize}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.modelDesc, { color: colors.textSecondary }]}>
                    {model.description}
                  </Text>
                  <Text style={[styles.modelMeta, { color: colors.textSecondary }]}>
                    Speed: {model.speed} · {model.accuracy}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* AI Note Reasoning Model Selection */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>AI Note Synthesis Model</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Small Language Models (SLMs) used for extracting decisions, action items, and summaries.
          </Text>

          <View style={styles.modelsList}>
            {AVAILABLE_SLM_MODELS.map((model) => {
              const isSelected = settings.activeSlmModel === model.id;
              return (
                <TouchableOpacity
                  key={model.id}
                  onPress={() => handleSelectSLMModel(model.id)}
                  style={[
                    styles.modelOption,
                    {
                      backgroundColor: isSelected
                        ? colors.secondaryContainer
                        : colors.surfaceContainerLow,
                      borderColor: isSelected ? colors.secondary : colors.cardBorder,
                    },
                  ]}>
                  <View style={styles.modelHeaderRow}>
                    <Text
                      style={[
                        styles.modelName,
                        { color: isSelected ? colors.secondary : colors.text },
                      ]}>
                      {model.name}
                    </Text>
                    <View style={[styles.modelBadge, { backgroundColor: colors.surfaceContainer }]}>
                      <Text style={[styles.modelBadgeText, { color: colors.textSecondary }]}>
                        {model.formattedSize}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.modelDesc, { color: colors.textSecondary }]}>
                    {model.description}
                  </Text>
                  <Text style={[styles.modelMeta, { color: colors.textSecondary }]}>
                    RAM: {model.ramUsage} · Speed: {model.speed}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Data Management */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Data Management</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
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
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    marginTop: 4,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    backgroundColor: 'transparent',
    paddingRight: 8,
  },
  toggleTextCol: {
    flex: 1,
    gap: 2,
    backgroundColor: 'transparent',
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  toggleDescription: {
    fontSize: 11,
    lineHeight: 15,
  },
  apiKeyBox: {
    gap: 6,
    marginTop: 8,
    backgroundColor: 'transparent',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  apiKeyInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  apiKeyInput: {
    flex: 1,
    fontSize: 13,
  },
  saveKeyBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    marginTop: 4,
  },
  saveKeyBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  modelsList: {
    gap: 10,
    marginTop: 4,
    backgroundColor: 'transparent',
  },
  modelOption: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  modelHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  modelName: {
    fontSize: 14,
    fontWeight: '700',
  },
  modelBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  modelBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  modelDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  modelMeta: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
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
