import React, { useState } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View as RNView,
  Alert,
  Platform,
} from 'react-native';
import { Text, View } from './Themed';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Colors from '@/constants/Colors';
import { useColorScheme } from './useColorScheme';
import { IdeaCollision, IdeaCollisionSourceNote } from '@/types/meeting';

interface IdeaCollisionCardProps {
  collision: IdeaCollision;
  onDismiss: (id: string) => void;
  onSave: (id: string) => void;
  onStartExperiment?: (id: string) => void;
  onPressSourceNote?: (note: IdeaCollisionSourceNote) => void;
}

export function IdeaCollisionCard({
  collision,
  onDismiss,
  onSave,
  onStartExperiment,
  onPressSourceNote,
}: IdeaCollisionCardProps) {
  const theme = useColorScheme();
  const colors = Colors[theme];
  const router = useRouter();

  const [expanded, setExpanded] = useState(true);

  const isSaved = collision.status === 'saved';
  const isExperimenting = collision.status === 'experimenting';

  const handleSourcePress = (source: IdeaCollisionSourceNote) => {
    if (onPressSourceNote) {
      onPressSourceNote(source);
    } else if (source.recordingId) {
      router.push(`/notes/${source.recordingId}`);
    }
  };

  const confirmDismiss = () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        'Dismiss this idea connection? It will be removed from your active suggestions.'
      );
      if (confirmed) onDismiss(collision.id);
    } else {
      Alert.alert(
        'Dismiss Weak Connection',
        'Dismiss this idea connection? It will be removed from your active suggestions.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Dismiss',
            style: 'destructive',
            onPress: () => onDismiss(collision.id),
          },
        ]
      );
    }
  };

  const synergyPercent = Math.round((collision.relevanceScore || 0.88) * 100);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: isSaved ? colors.primary : colors.cardBorder,
        },
      ]}>
      {/* Top Header Badge & Actions */}
      <View style={styles.topRow}>
        <View style={styles.badgeRow}>
          <View
            style={[
              styles.sparkleBadge,
              { backgroundColor: colors.primaryContainer },
            ]}>
            <Ionicons name="flash" size={13} color={colors.primary} />
            <Text style={[styles.sparkleBadgeText, { color: colors.primary }]}>
              IDEA COLLISION
            </Text>
          </View>
          <View
            style={[
              styles.synergyBadge,
              { backgroundColor: colors.surfaceContainer },
            ]}>
            <Text
              style={[styles.synergyText, { color: colors.textSecondary }]}>
              {synergyPercent}% Synergy
            </Text>
          </View>
          {isExperimenting && (
            <View
              style={[
                styles.experimentBadge,
                { backgroundColor: colors.successSoft },
              ]}>
              <Text style={[styles.experimentBadgeText, { color: colors.success }]}>🔬 Testing</Text>
            </View>
          )}
        </View>

        {/* Action Controls */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            onPress={() => onSave(collision.id)}
            style={[
              styles.iconBtn,
              {
                backgroundColor: isSaved
                  ? colors.primaryContainer
                  : colors.surfaceContainer,
              },
            ]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel={isSaved ? 'Breakthrough Saved' : 'Save Breakthrough'}>
            <Ionicons
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              size={17}
              color={isSaved ? colors.primary : colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={confirmDismiss}
            style={[styles.iconBtn, { backgroundColor: colors.surfaceContainer }]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Dismiss Weak Connection">
            <Ionicons name="close" size={17} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Synthesized Idea Title */}
      <Text style={[styles.ideaTitle, { color: colors.text }]}>
        {collision.title}
      </Text>

      {/* Shared Mechanism Box (Crucial Connection Explanation) */}
      <View
        style={[
          styles.mechanismCard,
          {
            backgroundColor: colors.primarySoft,
            borderColor: colors.borderStrong,
          },
        ]}>
        <View style={styles.mechanismHeader}>
          <Ionicons name="git-merge-outline" size={15} color={colors.primary} />
          <Text
            style={[
              styles.mechanismHeaderLabel,
              { color: colors.primary },
            ]}>
            SHARED MECHANISM & LATENT PRINCIPLE
          </Text>
        </View>
        <Text
          style={[styles.mechanismBody, { color: colors.text }]}
          numberOfLines={expanded ? undefined : 2}>
          {collision.sharedMechanism}
        </Text>
      </View>

      {/* Overlapping Concepts Pills */}
      {collision.overlappingConcepts && collision.overlappingConcepts.length > 0 && (
        <View style={styles.conceptsSection}>
          <Text style={[styles.sectionMiniLabel, { color: colors.textMuted }]}>
            OVERLAPPING CONCEPTS
          </Text>
          <View style={styles.conceptsPillsRow}>
            {collision.overlappingConcepts.map((concept, idx) => (
              <View
                key={`${concept}-${idx}`}
                style={[
                  styles.conceptChip,
                  {
                    backgroundColor: colors.surfaceContainer,
                    borderColor: colors.cardBorder,
                  },
                ]}>
                <Ionicons
                  name="link-outline"
                  size={11}
                  color={colors.secondary}
                />
                <Text
                  style={[
                    styles.conceptChipText,
                    { color: colors.textSecondary },
                  ]}>
                  {concept}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Connected Source Notes Section */}
      <View style={styles.sourceNotesSection}>
        <View style={styles.sourceSectionHeader}>
          <Text style={[styles.sectionMiniLabel, { color: colors.textMuted }]}>
            CONNECTING {collision.sourceNotes.length} DISPARATE THOUGHTS
          </Text>
          <Text style={[styles.sourceNoteSubHint, { color: colors.textMuted }]}>
            Tap to view source
          </Text>
        </View>

        <View style={styles.sourceCardsContainer}>
          {collision.sourceNotes.map((note, index) => (
            <TouchableOpacity
              key={`${note.recordingId}-${index}`}
              activeOpacity={0.7}
              onPress={() => handleSourcePress(note)}
              style={[
                styles.sourceCard,
                {
                  backgroundColor: colors.surfaceContainer,
                  borderColor: colors.cardBorder,
                },
              ]}>
              <View style={styles.sourceCardLeft}>
                <View
                  style={[
                    styles.sourceDot,
                    {
                      backgroundColor:
                        index === 0
                          ? colors.primary
                          : index === 1
                          ? colors.success
                          : colors.warning,
                    },
                  ]}
                />
                <View style={styles.sourceTextCol}>
                  <View style={styles.sourceMetaRow}>
                    <Text
                      style={[
                        styles.sourceTitle,
                        { color: colors.text },
                      ]}
                      numberOfLines={1}>
                      {note.meetingTitle}
                    </Text>
                    <Text
                      style={[
                        styles.sourceDate,
                        { color: colors.textMuted },
                      ]}>
                      • {note.date}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.sourceSnippet,
                      { color: colors.textSecondary },
                    ]}
                    numberOfLines={2}>
                    "{note.excerptSnippet}"
                  </Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.textMuted}
                style={styles.sourceChevron}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Why Useful Explanation */}
      <View
        style={[
          styles.whyUsefulBox,
          {
            backgroundColor: colors.warningSoft,
            borderColor: colors.borderStrong,
          },
        ]}>
        <View style={styles.whyUsefulHeader}>
          <Ionicons name="bulb-outline" size={15} color={colors.warning} />
          <Text style={[styles.whyUsefulLabel, { color: colors.warning }]}>WHY THIS IS USEFUL</Text>
        </View>
        <Text style={[styles.whyUsefulText, { color: colors.text }]}>
          {collision.whyUseful}
        </Text>
      </View>

      {/* Small Experiment Card */}
      <View
        style={[
          styles.experimentCard,
          {
            backgroundColor: colors.successSoft,
            borderColor: colors.borderStrong,
          },
        ]}>
        <View style={styles.experimentHeaderRow}>
          <View style={styles.experimentTitleRow}>
            <Ionicons name="flask-outline" size={15} color={colors.success} />
            <Text style={[styles.experimentLabel, { color: colors.success }]}>SMALL TESTABLE EXPERIMENT</Text>
          </View>

          {onStartExperiment && (
            <TouchableOpacity
              onPress={() => onStartExperiment(collision.id)}
              style={[
                styles.experimentActionBtn,
                {
                  backgroundColor: isExperimenting ? colors.successTonal : colors.success,
                },
              ]}>
              <Ionicons
                name={isExperimenting ? 'checkmark-circle' : 'play-outline'}
                size={12}
                color={colors.onSuccessTonal}
              />
              <Text style={[styles.experimentActionText, { color: colors.onSuccessTonal }]}>
                {isExperimenting ? 'Testing' : 'Test This Idea'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={[styles.experimentText, { color: colors.text }]}>
          {collision.smallExperiment}
        </Text>
      </View>

      {/* Card Footer: Dismiss Weak Connection Button */}
      <View style={styles.footerRow}>
        <TouchableOpacity
          onPress={confirmDismiss}
          style={styles.dismissWeakBtn}
          accessibilityLabel="Dismiss weak connection">
          <Ionicons name="trash-outline" size={13} color={colors.textMuted} />
          <Text style={[styles.dismissWeakText, { color: colors.textMuted }]}>
            Dismiss weak connection
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
    elevation: 0,
    shadowOpacity: 0,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: 'transparent',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'transparent',
    flexWrap: 'wrap',
  },
  sparkleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    height: 24,
    borderRadius: 999,
  },
  sparkleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  synergyBadge: {
    paddingHorizontal: 8,
    height: 24,
    borderRadius: 999,
    justifyContent: 'center',
  },
  synergyText: {
    fontSize: 11,
    fontWeight: '600',
  },
  experimentBadge: {
    paddingHorizontal: 8,
    height: 24,
    borderRadius: 999,
    justifyContent: 'center',
  },
  experimentBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'transparent',
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ideaTitle: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
    marginBottom: 12,
  },
  mechanismCard: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  mechanismHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
    backgroundColor: 'transparent',
  },
  mechanismHeaderLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  mechanismBody: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },
  conceptsSection: {
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  sectionMiniLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
    marginBottom: 6,
  },
  conceptsPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    backgroundColor: 'transparent',
  },
  conceptChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    height: 28,
    borderRadius: 999,
    borderWidth: 1,
  },
  conceptChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  sourceNotesSection: {
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  sourceSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    backgroundColor: 'transparent',
  },
  sourceNoteSubHint: {
    fontSize: 10,
    fontStyle: 'italic',
  },
  sourceCardsContainer: {
    gap: 8,
    backgroundColor: 'transparent',
  },
  sourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
  },
  sourceCardLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    flex: 1,
    backgroundColor: 'transparent',
  },
  sourceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
  },
  sourceTextCol: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  sourceMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
    backgroundColor: 'transparent',
  },
  sourceTitle: {
    fontSize: 12,
    fontWeight: '700',
    maxWidth: '75%',
  },
  sourceDate: {
    fontSize: 10,
  },
  sourceSnippet: {
    fontSize: 11,
    lineHeight: 15,
  },
  sourceChevron: {
    marginLeft: 6,
  },
  whyUsefulBox: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  whyUsefulHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
    backgroundColor: 'transparent',
  },
  whyUsefulLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  whyUsefulText: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
  },
  experimentCard: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  experimentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    backgroundColor: 'transparent',
  },
  experimentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'transparent',
  },
  experimentLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  experimentActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    height: 28,
    borderRadius: 10,
  },
  experimentActionText: {
    fontSize: 10,
    fontWeight: '700',
  },
  experimentText: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingTop: 4,
    backgroundColor: 'transparent',
  },
  dismissWeakBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  dismissWeakText: {
    fontSize: 11,
    fontWeight: '500',
  },
});

