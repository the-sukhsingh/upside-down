import React from 'react';
import { StyleSheet, TouchableOpacity, Share } from 'react-native';
import { Text, View } from './Themed';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from './useColorScheme';
import { PreMeetingBriefing } from '@/types/meeting';

interface BriefingCardProps {
  briefing: PreMeetingBriefing;
  meetingTitle: string;
  onRegenerate?: () => void;
  isLoading?: boolean;
}

export function BriefingCard({
  briefing,
  meetingTitle,
  onRegenerate,
  isLoading = false,
}: BriefingCardProps) {
  const theme = useColorScheme();
  const colors = Colors[theme];

  const handleShare = async () => {
    const text = `Before-You-Meet Briefing: ${meetingTitle}\n\nHeadline:\n${briefing.headline}\n\nWhat Needs Attention Today:\n${briefing.attentionItems.map((a) => `• ${a}`).join('\n')}\n\nOutstanding Tasks:\n${briefing.outstandingTasks.map((t) => `• [${t.priority?.toUpperCase()}] ${t.task} (${t.assignee || 'Team'})`).join('\n')}\n\nPrevious Decisions:\n${briefing.previousDecisions.map((d) => `• ${d}`).join('\n')}\n\nUnresolved Questions:\n${briefing.unresolvedQuestions.map((q) => `? ${q}`).join('\n')}`;

    try {
      await Share.share({ title: `Briefing: ${meetingTitle}`, message: text });
    } catch (e) {
      console.warn('Share briefing notice:', e);
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <View style={[styles.iconBox, { backgroundColor: colors.primaryContainer }]}>
            <Ionicons name="sparkles" size={18} color={colors.primary} />
          </View>
          <View style={styles.titleTexts}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Before-You-Meet Briefing</Text>
            <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
              Intelligence compiled from previous conversations
            </Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          {onRegenerate ? (
            <TouchableOpacity
              onPress={onRegenerate}
              disabled={isLoading}
              style={[styles.actionBtn, { backgroundColor: colors.surfaceContainer }]}>
              <Ionicons
                name="refresh-outline"
                size={14}
                color={colors.text}
                style={isLoading ? { opacity: 0.5 } : undefined}
              />
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            onPress={handleShare}
            style={[styles.actionBtn, { backgroundColor: colors.surfaceContainer }]}>
            <Ionicons name="share-outline" size={14} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Strategic Headline */}
      <View style={[styles.headlineBox, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.cardBorder }]}>
        <Text style={[styles.headlineText, { color: colors.text }]}>
          "{briefing.headline}"
        </Text>
      </View>

      {/* 1. What Needs Attention Today */}
      {briefing.attentionItems.length > 0 && (
        <View style={styles.sectionCol}>
          <View style={styles.sectionHeader}>
            <Ionicons name="flame-outline" size={15} color={colors.coral} />
            <Text style={[styles.sectionHeading, { color: colors.coral }]}>What Needs Attention Today</Text>
          </View>
          <View style={styles.itemsList}>
            {briefing.attentionItems.map((item, idx) => (
              <View key={idx} style={styles.bulletRow}>
                <Ionicons name="alert-circle" size={13} color={colors.coral} style={{ marginTop: 2 }} />
                <Text style={[styles.bulletText, { color: colors.text }]}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 2. Outstanding Tasks From Last Conversations */}
      {briefing.outstandingTasks.length > 0 && (
        <View style={styles.sectionCol}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time-outline" size={15} color={colors.primary} />
            <Text style={[styles.sectionHeading, { color: colors.text }]}>
              Outstanding Tasks ({briefing.outstandingTasks.length})
            </Text>
          </View>
          <View style={styles.itemsList}>
            {briefing.outstandingTasks.map((t, idx) => (
              <View
                key={idx}
                style={[styles.taskItemBox, { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.cardBorder }]}>
                <View style={styles.taskTextCol}>
                  <Text style={[styles.taskTitle, { color: colors.text }]}>{t.task}</Text>
                  <View style={styles.taskMetaRow}>
                    <Text style={[styles.taskAssignee, { color: colors.textSecondary }]}>
                      Assignee: <Text style={{ color: colors.primary, fontWeight: '600' }}>{t.assignee || 'Team'}</Text>
                    </Text>
                    {t.priority ? (
                      <View style={[styles.priorityBadge, { backgroundColor: colors.surfaceContainer }]}>
                        <Text style={[styles.priorityText, { color: colors.textSecondary }]}>
                          {t.priority.toUpperCase()}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 3. Previous Decisions */}
      {briefing.previousDecisions.length > 0 && (
        <View style={styles.sectionCol}>
          <View style={styles.sectionHeader}>
            <Ionicons name="checkmark-circle-outline" size={15} color={colors.oliveText} />
            <Text style={[styles.sectionHeading, { color: colors.text }]}>Previous Decisions Confirmed</Text>
          </View>
          <View style={styles.itemsList}>
            {briefing.previousDecisions.map((d, idx) => (
              <View key={idx} style={styles.bulletRow}>
                <Ionicons name="checkmark" size={13} color={colors.oliveText} style={{ marginTop: 2 }} />
                <Text style={[styles.bulletText, { color: colors.text }]}>{d}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 4. Unresolved Questions */}
      {briefing.unresolvedQuestions.length > 0 && (
        <View style={styles.sectionCol}>
          <View style={styles.sectionHeader}>
            <Ionicons name="help-circle-outline" size={15} color="#D97706" />
            <Text style={[styles.sectionHeading, { color: '#D97706' }]}>Unresolved Questions to Ask</Text>
          </View>
          <View style={styles.itemsList}>
            {briefing.unresolvedQuestions.map((q, idx) => (
              <View key={idx} style={styles.bulletRow}>
                <Ionicons name="help" size={13} color="#D97706" style={{ marginTop: 2 }} />
                <Text style={[styles.bulletText, { color: colors.text }]}>{q}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 5. Suggested Agenda */}
      {briefing.suggestedAgenda.length > 0 && (
        <View style={styles.sectionCol}>
          <View style={styles.sectionHeader}>
            <Ionicons name="list-outline" size={15} color={colors.textSecondary} />
            <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>Suggested Agenda</Text>
          </View>
          <View style={styles.itemsList}>
            {briefing.suggestedAgenda.map((ag, idx) => (
              <View key={idx} style={styles.bulletRow}>
                <Text style={[styles.stepNum, { color: colors.primary }]}>{idx + 1}.</Text>
                <Text style={[styles.bulletText, { color: colors.text }]}>{ag}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    gap: 14,
    marginVertical: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'transparent',
    flex: 1,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleTexts: {
    backgroundColor: 'transparent',
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'transparent',
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headlineBox: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  headlineText: {
    fontSize: 13,
    fontWeight: '600',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  sectionCol: {
    gap: 8,
    backgroundColor: 'transparent',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'transparent',
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  itemsList: {
    gap: 6,
    backgroundColor: 'transparent',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'transparent',
  },
  bulletText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  stepNum: {
    fontSize: 12,
    fontWeight: '700',
    width: 16,
  },
  taskItemBox: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  taskTextCol: {
    gap: 4,
    backgroundColor: 'transparent',
  },
  taskTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  taskMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  taskAssignee: {
    fontSize: 11,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
  },
});

