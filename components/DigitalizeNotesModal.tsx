import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Modal,
  ScrollView,
  Pressable,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from './Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from './useColorScheme';
import { visionNoteService, VisionDigitizeResult } from '@/services/visionNoteService';

interface DigitalizeNotesModalProps {
  visible: boolean;
  onClose: () => void;
}

const PROCESSING_STEPS = [
  'Inspecting image structure & layout...',
  'Deciphering handwriting & whiteboard text...',
  'Interpreting workflow & architecture diagrams...',
  'Extracting key decisions & action items...',
  'Synthesizing Promise Radar commitments...',
];

export function DigitalizeNotesModal({ visible, onClose }: DigitalizeNotesModalProps) {
  const router = useRouter();
  const theme = useColorScheme();
  const colors = Colors[theme];

  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [selectedBase64, setSelectedBase64] = useState<string | null>(null);
  const [selectedMimeType, setSelectedMimeType] = useState<string>('image/jpeg');
  const [meetingContextTitle, setMeetingContextTitle] = useState<string>('');

  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [result, setResult] = useState<VisionDigitizeResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reset state when modal is closed
  useEffect(() => {
    if (!visible) {
      setSelectedImageUri(null);
      setSelectedBase64(null);
      setSelectedMimeType('image/jpeg');
      setMeetingContextTitle('');
      setIsProcessing(false);
      setResult(null);
      setErrorMessage(null);
      setCurrentStepIdx(0);
    }
  }, [visible]);

  // Step rotation animation during processing
  useEffect(() => {
    if (!isProcessing) return;
    const interval = setInterval(() => {
      setCurrentStepIdx((prev) => (prev + 1) % PROCESSING_STEPS.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [isProcessing]);

  /**
   * Helper to ensure base64 data is present even on edge web environments
   */
  const resolveBase64 = async (asset: ImagePicker.ImagePickerAsset): Promise<string> => {
    if (asset.base64 && asset.base64.length > 0) {
      return asset.base64;
    }
    // Fallback: fetch blob and convert to base64
    const res = await fetch(asset.uri);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const str = reader.result as string;
        const clean = str.split(',')[1] || str;
        resolve(clean);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  /**
   * Launch camera to snap meeting notes/whiteboard
   */
  const handleTakePhoto = async () => {
    try {
      setErrorMessage(null);
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Camera Permission Required',
            'Please enable camera access in your settings to snap photos of meeting notes and whiteboards.'
          );
          return;
        }
      }

      const pickerResult = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.85,
        base64: true,
      });

      if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
        const asset = pickerResult.assets[0];
        setSelectedImageUri(asset.uri);
        setSelectedMimeType(asset.mimeType || 'image/jpeg');
        const base64 = await resolveBase64(asset);
        setSelectedBase64(base64);
      }
    } catch (err: any) {
      console.warn('Camera launch error:', err);
      setErrorMessage(err.message || 'Unable to access camera.');
    }
  };

  /**
   * Pick existing image from photo library
   */
  const handlePickFromGallery = async () => {
    try {
      setErrorMessage(null);
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Photo Library Permission',
            'Please enable photo library access in your settings to upload whiteboard or meeting photos.'
          );
          return;
        }
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.85,
        base64: true,
      });

      if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
        const asset = pickerResult.assets[0];
        setSelectedImageUri(asset.uri);
        setSelectedMimeType(asset.mimeType || 'image/jpeg');
        const base64 = await resolveBase64(asset);
        setSelectedBase64(base64);
      }
    } catch (err: any) {
      console.warn('Gallery pick error:', err);
      setErrorMessage(err.message || 'Unable to open photo library.');
    }
  };

  /**
   * Send image to Groq Vision
   */
  const handleDigitalize = async () => {
    if (!selectedBase64) {
      setErrorMessage('Please select or snap a photo of your notes first.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setCurrentStepIdx(0);

    try {
      const digitizeResult = await visionNoteService.digitalizeNoteImage(
        selectedBase64,
        selectedMimeType,
        meetingContextTitle.trim() || undefined
      );
      setResult(digitizeResult);
    } catch (err: any) {
      console.error('Vision digitalization failed:', err);
      setErrorMessage(
        err.message || 'Digitalization failed. Please check your Groq API key and try again.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Navigate to the newly generated note detail screen
   */
  const handleViewNote = () => {
    if (!result) return;
    const noteId = result.recording.id;
    onClose();
    router.push({
      pathname: '/notes/[id]',
      params: { id: noteId },
    });
  };

  /**
   * Reset to scan another photo
   */
  const handleResetForAnother = () => {
    setSelectedImageUri(null);
    setSelectedBase64(null);
    setSelectedMimeType('image/jpeg');
    setResult(null);
    setErrorMessage(null);
    setCurrentStepIdx(0);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={isProcessing ? undefined : onClose} />

        <View
          style={[
            styles.sheetContainer,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}>
          {/* Header */}
          <View style={[styles.headerRow, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconBadge, { backgroundColor: colors.primaryContainer }]}>
                <Ionicons name="camera" size={20} color={colors.primary} />
              </View>
              <View style={styles.titleCol}>
                <Text style={[styles.sheetTitle, { color: colors.text }]}>
                  Digitalize Notes & Whiteboards
                </Text>
                <View style={styles.modelTagRow}>
                  <View style={[styles.modelTag, { backgroundColor: colors.surfaceContainer }]}>
                    <Ionicons name="sparkles" size={11} color={colors.primary} />
                    <Text style={[styles.modelTagText, { color: colors.primary }]}>
                      Groq Vision · Qwen 3.8 27B
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              disabled={isProcessing}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={[
                styles.closeBtn,
                { backgroundColor: colors.surfaceContainer, opacity: isProcessing ? 0.4 : 1 },
              ]}>
              <Ionicons name="close" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.sheetBody}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
            {/* 1. Error Message if any */}
            {errorMessage && (
              <View
                style={[
                  styles.errorCard,
                  { backgroundColor: colors.errorContainer, borderColor: colors.error },
                ]}>
                <Ionicons name="alert-circle" size={18} color={colors.error} />
                <Text style={[styles.errorText, { color: colors.onErrorContainer }]}>
                  {errorMessage}
                </Text>
              </View>
            )}

            {/* 2. Success Result Screen */}
            {result && !isProcessing ? (
              <View style={styles.resultContainer}>
                <View style={[styles.successBanner, { backgroundColor: colors.oliveLight }]}>
                  <Ionicons name="checkmark-circle" size={24} color={colors.oliveDark} />
                  <View style={styles.successTextCol}>
                    <Text style={[styles.successTitle, { color: colors.oliveDark }]}>
                      Digitalization Complete!
                    </Text>
                    <Text style={[styles.successSubtitle, { color: colors.oliveDark }]}>
                      Processed in {(result.inferenceTimeMs / 1000).toFixed(2)}s via Groq LPU
                    </Text>
                  </View>
                </View>

                {/* Extracted Card Preview */}
                <View
                  style={[
                    styles.resultCard,
                    { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border },
                  ]}>
                  <Text style={[styles.resultCardTitle, { color: colors.text }]}>
                    {result.extractedTitle}
                  </Text>
                  <Text
                    style={[styles.resultCardSummary, { color: colors.textSecondary }]}
                    numberOfLines={3}>
                    {result.summary.executiveSummary}
                  </Text>

                  {/* Stat Chips */}
                  <View style={styles.statsRow}>
                    <View
                      style={[styles.statChip, { backgroundColor: colors.surfaceContainer }]}>
                      <Ionicons name="checkmark-done" size={14} color={colors.primary} />
                      <Text style={[styles.statChipText, { color: colors.text }]}>
                        {result.summary.actionItems.length} Action Items
                      </Text>
                    </View>

                    <View
                      style={[styles.statChip, { backgroundColor: colors.surfaceContainer }]}>
                      <Ionicons name="radio" size={14} color={colors.coral} />
                      <Text style={[styles.statChipText, { color: colors.text }]}>
                        {result.commitments.length} Promises
                      </Text>
                    </View>

                    <View
                      style={[styles.statChip, { backgroundColor: colors.surfaceContainer }]}>
                      <Ionicons name="bulb" size={14} color={colors.amber} />
                      <Text style={[styles.statChipText, { color: colors.text }]}>
                        {result.summary.keyDecisions.length} Decisions
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Primary Action Button */}
                <TouchableOpacity
                  onPress={handleViewNote}
                  style={[styles.actionBtn, { backgroundColor: colors.primaryTonal }]}>
                  <Ionicons name="document-text" size={18} color={colors.onPrimaryTonal} />
                  <Text style={[styles.actionBtnText, { color: colors.onPrimaryTonal }]}>
                    View Digitalized Note & Tasks
                  </Text>
                  <Ionicons name="arrow-forward" size={16} color={colors.onPrimaryTonal} />
                </TouchableOpacity>

                {/* Secondary Button */}
                <TouchableOpacity
                  onPress={handleResetForAnother}
                  style={[
                    styles.secondaryBtn,
                    { borderColor: colors.border, backgroundColor: colors.surfaceContainer },
                  ]}>
                  <Ionicons name="camera-reverse-outline" size={17} color={colors.text} />
                  <Text style={[styles.secondaryBtnText, { color: colors.text }]}>
                    Scan Another Note
                  </Text>
                </TouchableOpacity>
              </View>
            ) : isProcessing ? (
              /* 3. Processing State */
              <View style={styles.processingContainer}>
                <View style={[styles.spinnerRing, { backgroundColor: colors.primaryContainer }]}>
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
                <Text style={[styles.processingHeading, { color: colors.text }]}>
                  Groq Vision is analyzing...
                </Text>
                <Text style={[styles.processingSub, { color: colors.primary }]}>
                  {PROCESSING_STEPS[currentStepIdx]}
                </Text>
                <View
                  style={[
                    styles.processingTipBox,
                    { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border },
                  ]}>
                  <Ionicons name="flash" size={14} color={colors.primary} />
                  <Text style={[styles.processingTipText, { color: colors.textSecondary }]}>
                    Groq LPU processes visual OCR and extracts decisions in seconds.
                  </Text>
                </View>
              </View>
            ) : selectedImageUri ? (
              /* 4. Preview State with Image Picked */
              <View style={styles.previewContainer}>
                <View style={[styles.imageWrapper, { borderColor: colors.border }]}>
                  <Image source={{ uri: selectedImageUri }} style={styles.previewImage} />
                  <TouchableOpacity
                    onPress={handleResetForAnother}
                    style={[styles.retakeFloatingBtn, { backgroundColor: colors.surfaceContainerHighest }]}>
                    <Ionicons name="sync" size={14} color={colors.text} />
                    <Text style={[styles.retakeText, { color: colors.text }]}>Retake</Text>
                  </TouchableOpacity>
                </View>

                {/* Optional Meeting Context */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                    Meeting Context / Title (Optional)
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: colors.surfaceContainerLow,
                        borderColor: colors.border,
                        color: colors.text,
                      },
                    ]}
                    placeholder="e.g. Sprint Architecture Sync or Client Review"
                    placeholderTextColor={colors.textSecondary}
                    value={meetingContextTitle}
                    onChangeText={setMeetingContextTitle}
                  />
                </View>

                {/* Digitalize CTA */}
                <TouchableOpacity
                  onPress={handleDigitalize}
                  style={[styles.actionBtn, { backgroundColor: colors.primaryTonal }]}>
                  <Ionicons name="sparkles" size={18} color={colors.onPrimaryTonal} />
                  <Text style={[styles.actionBtnText, { color: colors.onPrimaryTonal }]}>
                    Digitalize with Groq Vision
                  </Text>
                  <Ionicons name="arrow-forward" size={16} color={colors.onPrimaryTonal} />
                </TouchableOpacity>

                {/* Retake/Cancel Link */}
                <TouchableOpacity onPress={handleResetForAnother} style={styles.cancelLink}>
                  <Text style={[styles.cancelLinkText, { color: colors.textSecondary }]}>
                    Choose a different photo
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* 5. Initial Selection Screen */
              <View style={styles.initialContainer}>
                {/* Optional Meeting Context */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                    Meeting / Note Context (Optional)
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: colors.surfaceContainerLow,
                        borderColor: colors.border,
                        color: colors.text,
                      },
                    ]}
                    placeholder="e.g. System Design Whiteboard, Product Roadmap"
                    placeholderTextColor={colors.textSecondary}
                    value={meetingContextTitle}
                    onChangeText={setMeetingContextTitle}
                  />
                </View>

                <Text style={[styles.pickerPrompt, { color: colors.text }]}>
                  Select note source:
                </Text>

                {/* Selection Cards */}
                <View style={styles.buttonTilesRow}>
                  {/* Option A: Take Photo */}
                  <TouchableOpacity
                    onPress={handleTakePhoto}
                    style={[
                      styles.pickerTile,
                      {
                        backgroundColor: colors.surfaceContainerLow,
                        borderColor: colors.border,
                      },
                    ]}>
                    <View
                      style={[
                        styles.pickerTileIconCircle,
                        { backgroundColor: colors.primaryContainer },
                      ]}
                    >
                      <Ionicons name="camera" size={26} color={colors.primary} />
                    </View>
                    <Text style={[styles.pickerTileTitle, { color: colors.text }]}>Take Photo</Text>
                    <Text style={[styles.pickerTileSub, { color: colors.textSecondary }]}>
                      Snap whiteboard or paper notes
                    </Text>
                  </TouchableOpacity>

                  {/* Option B: Choose from Library */}
                  <TouchableOpacity
                    onPress={handlePickFromGallery}
                    style={[
                      styles.pickerTile,
                      {
                        backgroundColor: colors.surfaceContainerLow,
                        borderColor: colors.border,
                      },
                    ]}>
                    <View
                      style={[
                        styles.pickerTileIconCircle,
                        { backgroundColor: colors.surfaceContainerHighest },
                      ]}
                    >
                      <Ionicons name="images" size={26} color={colors.primary} />
                    </View>
                    <Text style={[styles.pickerTileTitle, { color: colors.text }]}>
                      Photo Library
                    </Text>
                    <Text style={[styles.pickerTileSub, { color: colors.textSecondary }]}>
                      Upload existing note screenshots
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Features & Capabilities Callout */}
                <View
                  style={[
                    styles.capabilitiesBox,
                    {
                      backgroundColor: colors.surfaceContainerLow,
                      borderColor: colors.border,
                    },
                  ]}>
                  <View style={styles.capabilityRow}>
                    <Ionicons name="scan-circle" size={18} color={colors.primary} />
                    <Text style={[styles.capabilityText, { color: colors.text }]}>
                      OCR transcription for messy handwriting & sticky notes
                    </Text>
                  </View>
                  <View style={styles.capabilityRow}>
                    <Ionicons name="git-network-outline" size={18} color={colors.primary} />
                    <Text style={[styles.capabilityText, { color: colors.text }]}>
                      System diagrams, arrows, mind maps, and bullet points
                    </Text>
                  </View>
                  <View style={styles.capabilityRow}>
                    <Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} />
                    <Text style={[styles.capabilityText, { color: colors.text }]}>
                      Auto-extracts Action Items, Decisions, and Promise Radar
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(11, 11, 15, 0.6)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    maxHeight: SCREEN_HEIGHT * 0.88,
    minHeight: 380,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    backgroundColor: 'transparent',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    backgroundColor: 'transparent',
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleCol: {
    flex: 1,
    gap: 3,
    backgroundColor: 'transparent',
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  modelTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  modelTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  modelTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetBody: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    padding: 18,
    gap: 16,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  initialContainer: {
    gap: 16,
    backgroundColor: 'transparent',
  },
  inputGroup: {
    gap: 6,
    backgroundColor: 'transparent',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  textInput: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  pickerPrompt: {
    fontSize: 14,
    fontWeight: '600',
  },
  buttonTilesRow: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: 'transparent',
  },
  pickerTile: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  pickerTileIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerTileTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  pickerTileSub: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 15,
  },
  capabilitiesBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  capabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'transparent',
  },
  capabilityText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 17,
  },
  previewContainer: {
    gap: 16,
    backgroundColor: 'transparent',
  },
  imageWrapper: {
    position: 'relative',
    height: 220,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  retakeFloatingBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  retakeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionBtn: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 10,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  cancelLink: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  cancelLinkText: {
    fontSize: 13,
  },
  processingContainer: {
    alignItems: 'center',
    paddingVertical: 36,
    gap: 14,
    backgroundColor: 'transparent',
  },
  spinnerRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingHeading: {
    fontSize: 16,
    fontWeight: '700',
  },
  processingSub: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  processingTipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 10,
  },
  processingTipText: {
    fontSize: 12,
  },
  resultContainer: {
    gap: 14,
    backgroundColor: 'transparent',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
  },
  successTextCol: {
    flex: 1,
    gap: 2,
    backgroundColor: 'transparent',
  },
  successTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  successSubtitle: {
    fontSize: 11,
  },
  resultCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  resultCardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  resultCardSummary: {
    fontSize: 13,
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
    backgroundColor: 'transparent',
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  secondaryBtn: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
