import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  ScrollView,
  Pressable,
  TouchableOpacity,
  TextInput,
  Animated,
} from 'react-native';
import { View, Text } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import { useMeetingStore } from '@/store/meetingStore';
import { contextRecallService } from '@/services/contextRecallService';
import { LiveContextMatch } from '@/types/meeting';
import { NotePeekModal } from '@/components/NotePeekModal';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface LiveTopicRadarProps {
  isRecording: boolean;
  isPaused: boolean;
  currentMeetingId?: string;
}

export function LiveTopicRadar({
  isRecording,
  isPaused,
  currentMeetingId,
}: LiveTopicRadarProps) {
  const theme = useColorScheme();
  const colors = Colors[theme];

  const { activeRecording, pinLiveContext, unpinLiveContext } = useMeetingStore();
  const pinnedContexts = activeRecording.pinnedContexts || [];
  const liveTopics = activeRecording.liveTopics || [];

  const [matches, setMatches] = useState<LiveContextMatch[]>([]);
  const [activeSpeechSnippet, setActiveSpeechSnippet] = useState<string>('');
  const [peekMatch, setPeekMatch] = useState<LiveContextMatch | null>(null);
  const [isManualSearchOpen, setIsManualSearchOpen] = useState(false);
  const [manualQuery, setManualQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  // Radar pulsing animation
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let pulseLoop: Animated.CompositeAnimation | null = null;
    if (isRecording && !isPaused) {
      pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.45,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 900,
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();
    } else {
      pulseAnim.setValue(1);
    }

    return () => {
      pulseLoop?.stop();
    };
  }, [isRecording, isPaused, pulseAnim]);

  // Activate continuous live speech listener when recording starts
  useEffect(() => {
    if (!isRecording) {
      contextRecallService.stopLiveSpeechListener();
      setMatches([]);
      setActiveSpeechSnippet('');
      return;
    }

    if (isRecording && !isPaused) {
      contextRecallService.startLiveSpeechListener({
        onSpeechSnippet: (snippet) => {
          setActiveSpeechSnippet(snippet);
        },
        onTopicDetected: (topics) => {
          // Handled via store
        },
        onContextFound: (foundMatches) => {
          if (foundMatches.length > 0) {
            setMatches((prev) => {
              const combined = [...foundMatches, ...prev];
              const unique = Array.from(new Map(combined.map((m) => [m.recordingId, m])).values());
              return unique.slice(0, 4);
            });
          }
        },
        onMatchUpdated: (updatedMatch) => {
          setMatches((prev) =>
            prev.map((m) =>
              m.recordingId === updatedMatch.recordingId
                ? { ...m, aiSynthesis: updatedMatch.aiSynthesis }
                : m
            )
          );
        },
      });
    }

    return () => {
      contextRecallService.stopLiveSpeechListener();
    };
  }, [isRecording, isPaused]);

  // Handle manual or topic pill click search
  const handleSelectTopic = async (topic: string) => {
    setIsSearching(true);
    try {
      const found = await contextRecallService.triggerTopicSearch(topic, currentMeetingId, {
        onMatchUpdated: (updatedMatch) => {
          setMatches((prev) =>
            prev.map((m) =>
              m.recordingId === updatedMatch.recordingId
                ? { ...m, aiSynthesis: updatedMatch.aiSynthesis }
                : m
            )
          );
        },
      });
      if (found.length > 0) {
        setMatches((prev) => {
          const combined = [...found, ...prev];
          const unique = Array.from(new Map(combined.map((m) => [m.recordingId, m])).values());
          return unique.slice(0, 4);
        });
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleManualSearchSubmit = async () => {
    if (!manualQuery.trim()) return;
    await handleSelectTopic(manualQuery.trim());
    setManualQuery('');
    setIsManualSearchOpen(false);
  };

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => new Set(prev).add(id));
  };

  const handleTogglePin = (match: LiveContextMatch) => {
    const isAlreadyPinned = pinnedContexts.some((c) => c.recordingId === match.recordingId);
    if (isAlreadyPinned) {
      unpinLiveContext(match.id);
    } else {
      pinLiveContext(match);
    }
  };

  const visibleMatches = matches.filter((m) => !dismissedIds.has(m.id));

  // Suggested popular seed topics if none detected yet
  const displayTopics =
    liveTopics.length > 0
      ? liveTopics
      : ['Database', 'Architecture', 'Sprint 24', 'Checklist', 'Roadmap', 'Design'];

  return (
    <View style={styles.container}>
      {/* Radar Status Bar */}
      <View
        style={[
          styles.radarBanner,
          {
            backgroundColor: colors.surfaceContainerLow,
            borderColor: visibleMatches.length > 0 ? colors.primary : colors.cardBorder,
          },
        ]}>
        <View style={styles.radarBannerLeft}>
          <View style={styles.pulseWrapper}>
            <Animated.View
              style={[
                styles.pulseRing,
                {
                  borderColor: isRecording && !isPaused ? colors.secondary : colors.warning,
                  transform: [{ scale: pulseAnim }],
                  opacity: isRecording && !isPaused ? 0.6 : 0,
                },
              ]}
            />
            <View
              style={[
                styles.pulseCore,
                { backgroundColor: isRecording && !isPaused ? colors.secondary : colors.warning },
              ]}
            />
          </View>

          <View style={styles.radarBannerTitleCol}>
            <View style={styles.radarLabelRow}>
              <Text style={[styles.radarBadgeText, { color: colors.text }]}>
                LIVE TOPIC & CONTEXT RADAR
              </Text>
              {visibleMatches.length > 0 && (
                <View style={[styles.matchCounterPill, { backgroundColor: colors.primaryContainer }]}>
                  <Text style={[styles.matchCounterText, { color: colors.primary }]}>
                    {visibleMatches.length} {visibleMatches.length === 1 ? 'Match' : 'Matches'}
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.speechHintText, { color: colors.textSecondary }]} numberOfLines={1}>
              {activeSpeechSnippet
                ? `Heard: "${activeSpeechSnippet}"`
                : isRecording && !isPaused
                ? 'Listening to spoken keywords in real-time...'
                : 'Paused'}
            </Text>
          </View>
        </View>

        {/* Manual search button */}
        <TouchableOpacity
          onPress={() => setIsManualSearchOpen(!isManualSearchOpen)}
          style={[styles.searchToggleBtn, { backgroundColor: colors.surfaceContainer }]}>
          <Ionicons
            name={isManualSearchOpen ? 'close' : 'search'}
            size={16}
            color={colors.text}
          />
        </TouchableOpacity>
      </View>

      {/* Manual Topic Search Box */}
      {isManualSearchOpen && (
        <View style={[styles.manualSearchRow, { backgroundColor: colors.surfaceContainer }]}>
          <Ionicons name="search" size={16} color={colors.textSecondary} />
          <TextInput
            placeholder="Type project, topic, or keyword..."
            placeholderTextColor={colors.textMuted}
            value={manualQuery}
            onChangeText={setManualQuery}
            onSubmitEditing={handleManualSearchSubmit}
            returnKeyType="search"
            style={[styles.searchInput, { color: colors.text }]}
            autoFocus
          />
          {manualQuery.length > 0 && (
            <TouchableOpacity onPress={handleManualSearchSubmit} style={styles.searchSubmitBtn}>
              <Ionicons name="arrow-forward-circle" size={22} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Real-time Topic Chips Strip */}
      <View style={styles.topicStripRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.topicChipsScroll}>
          <View style={styles.topicsTagBadge}>
            <Ionicons name="pricetags" size={12} color={colors.primary} />
            <Text style={[styles.topicsTagLabel, { color: colors.primary }]}>TOPICS:</Text>
          </View>

          {displayTopics.map((topic, idx) => (
            <TouchableOpacity
              key={`${topic}-${idx}`}
              onPress={() => handleSelectTopic(topic)}
              style={[
                styles.topicChip,
                {
                  backgroundColor: colors.surfaceContainer,
                  borderColor: colors.border,
                },
              ]}>
              <Text style={[styles.topicChipText, { color: colors.text }]}>
                #{topic}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Matched Knowledge Flashcards */}
      {visibleMatches.length > 0 && (
        <View style={styles.flashcardsContainer}>
          {visibleMatches.map((match) => {
            const isPinned = pinnedContexts.some((c) => c.recordingId === match.recordingId);

            return (
              <View
                key={match.id}
                style={[
                  styles.contextCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: isPinned ? colors.primary : colors.cardBorder,
                  },
                ]}>
                {/* Card Header */}
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <View
                      style={[
                        styles.relevanceDot,
                        {
                          backgroundColor:
                            match.relevanceScore >= 0.7
                              ? colors.secondary
                              : match.relevanceScore >= 0.5
                              ? colors.primary
                              : colors.warning,
                        },
                      ]}
                    />
                    <View style={styles.cardTitles}>
                      <Text style={[styles.cardMeetingTitle, { color: colors.text }]} numberOfLines={1}>
                        {match.meetingTitle}
                      </Text>
                      <Text style={[styles.cardMetaText, { color: colors.textSecondary }]}>
                        {match.date} · Topic: <Text style={{ fontWeight: '600', color: colors.primary }}>#{match.matchedTopic}</Text>
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => handleDismiss(match.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="close-circle-outline" size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>

                {/* AI Recall Flash Brief */}
                {match.aiSynthesis ? (
                  <View
                    style={[
                      styles.aiFlashBrief,
                      { backgroundColor: colors.surfaceContainerLow },
                    ]}>
                    <Ionicons name="sparkles" size={13} color={colors.primary} />
                    <Text style={[styles.aiFlashText, { color: colors.text }]}>
                      {match.aiSynthesis}
                    </Text>
                  </View>
                ) : null}

                {/* Top Decision Bullet */}
                {match.keyDecisions.length > 0 && (
                  <View style={styles.bulletRow}>
                    <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
                    <Text style={[styles.bulletText, { color: colors.text }]} numberOfLines={2}>
                      <Text style={{ fontWeight: '600' }}>Decision: </Text>
                      {match.keyDecisions[0]}
                    </Text>
                  </View>
                )}

                {/* Top Open Commitment Bullet */}
                {match.openCommitments.length > 0 && (
                  <View style={styles.bulletRow}>
                    <Ionicons name="shield-checkmark" size={14} color={match.openCommitments[0].direction === 'they_owe_me' ? colors.secondary : colors.primary} />
                    <Text style={[styles.bulletText, { color: colors.text }]} numberOfLines={2}>
                      <Text style={{ fontWeight: '600', color: match.openCommitments[0].direction === 'they_owe_me' ? colors.secondary : colors.primary }}>
                        {match.openCommitments[0].direction === 'they_owe_me' ? 'Owed to you: ' : 'You owe: '}
                      </Text>
                      "{match.openCommitments[0].promise}"
                      {match.openCommitments[0].deadlinePhrase ? ` (${match.openCommitments[0].deadlinePhrase})` : ''}
                    </Text>
                  </View>
                )}

                {/* Card Actions */}
                <View style={[styles.cardActionsRow, { borderTopColor: colors.border }]}>
                  <TouchableOpacity
                    onPress={() => setPeekMatch(match)}
                    style={[styles.peekBtn, { borderColor: colors.border }]}>
                    <Ionicons name="eye-outline" size={14} color={colors.text} />
                    <Text style={[styles.peekBtnText, { color: colors.text }]}>Peek Full Note</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleTogglePin(match)}
                    style={[
                      styles.pinActionBtn,
                      {
                        backgroundColor: isPinned ? colors.primary : colors.surfaceContainer,
                      },
                    ]}>
                    <Ionicons
                      name={isPinned ? 'pin' : 'pin-outline'}
                      size={14}
                      color={isPinned ? colors.primaryText : colors.text}
                    />
                    <Text
                      style={[
                        styles.pinActionBtnText,
                        { color: isPinned ? colors.primaryText : colors.text },
                      ]}>
                      {isPinned ? 'Pinned' : 'Pin Context'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Pinned Contexts Indicator Badge */}
      {pinnedContexts.length > 0 && (
        <View
          style={[
            styles.pinnedTrayBadge,
            { backgroundColor: colors.surfaceContainerLow, borderColor: colors.primary },
          ]}>
          <Ionicons name="pin" size={14} color={colors.primary} />
          <Text style={[styles.pinnedTrayText, { color: colors.text }]}>
            <Text style={{ fontWeight: '700', color: colors.primary }}>
              {pinnedContexts.length} {pinnedContexts.length === 1 ? 'Context' : 'Contexts'} Pinned
            </Text>{' '}
            — will be auto-referenced in final generated notes.
          </Text>
        </View>
      )}

      {/* In-Place Note Peek Modal */}
      <NotePeekModal
        visible={peekMatch !== null}
        contextMatch={peekMatch}
        onClose={() => setPeekMatch(null)}
        onPin={handleTogglePin}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    gap: 8,
    backgroundColor: 'transparent',
  },
  radarBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.2,
  },
  radarBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    backgroundColor: 'transparent',
  },
  pulseWrapper: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  pulseRing: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
  },
  pulseCore: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  radarBannerTitleCol: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  radarLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'transparent',
  },
  radarBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  matchCounterPill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  matchCounterText: {
    fontSize: 10,
    fontWeight: '700',
  },
  speechHintText: {
    fontSize: 11,
    marginTop: 1,
  },
  searchToggleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 2,
  },
  searchSubmitBtn: {
    padding: 2,
  },
  topicStripRow: {
    backgroundColor: 'transparent',
  },
  topicChipsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 2,
  },
  topicsTagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'transparent',
    marginRight: 2,
  },
  topicsTagLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  topicChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  topicChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  flashcardsContainer: {
    gap: 10,
    marginTop: 4,
    backgroundColor: 'transparent',
  },
  contextCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    backgroundColor: 'transparent',
  },
  relevanceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cardTitles: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  cardMeetingTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  cardMetaText: {
    fontSize: 11,
    marginTop: 1,
  },
  aiFlashBrief: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    padding: 8,
    borderRadius: 8,
  },
  aiFlashText: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    flex: 1,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: 'transparent',
  },
  bulletText: {
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    backgroundColor: 'transparent',
  },
  peekBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  peekBtnText: {
    fontSize: 11,
    fontWeight: '500',
  },
  pinActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  pinActionBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  pinnedTrayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  pinnedTrayText: {
    fontSize: 11,
    flex: 1,
  },
});
