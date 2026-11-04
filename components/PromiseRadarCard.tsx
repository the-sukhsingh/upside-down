import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View as RNView } from 'react-native';
import { Text, View } from './Themed';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from './useColorScheme';
import { Commitment, CommitmentDirection } from '@/types/meeting';
import { EvidenceTag } from './EvidenceTag';

interface PromiseRadarCardProps {
  commitments: Commitment[];
  onToggleCommitment: (id: string) => void;
  onDeleteCommitment?: (id: string) => void;
  onPressEvidence?: (startTime: number, label: string) => void;
  title?: string;
  subtitle?: string;
  allowFilter?: boolean;
}

export function PromiseRadarCard({
  commitments,
  onToggleCommitment,
  onDeleteCommitment,
  onPressEvidence,
  title = 'Promise Radar',
  subtitle = 'Commitment tracker extracted from spoken conversation',
  allowFilter = true,
}: PromiseRadarCardProps) {
  const theme = useColorScheme();
  const colors = Colors[theme];

  const [activeDirection, setActiveDirection] = useState<'all' | CommitmentDirection>('all');
  const [showCompleted, setShowCompleted] = useState(false);

  const filtered = commitments.filter((c) => {
    if (activeDirection !== 'all' && c.direction !== activeDirection) return false;
    if (!showCompleted && c.completed) return false;
    return true;
  });

  const iOweCount = commitments.filter((c) => c.direction === 'i_owe' && !c.completed).length;
  const theyOweMeCount = commitments.filter((c) => c.direction === 'they_owe_me' && !c.completed).length;
  const overdueCount = commitments.filter((c) => {
    if (c.completed) return false;
    const phrase = (c.deadlinePhrase || '').toLowerCase();
    return phrase.includes('today') || phrase.includes('urgent') || phrase.includes('yesterday');
  }).length;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerTitleRow}>
          <View style={[styles.radarIconBox, { backgroundColor: colors.primaryContainer }]}>
            <Ionicons name="pulse-outline" size={18} color={colors.primary} />
          </View>
          <View style={styles.headerTexts}>
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
          </View>
        </View>

        {/* Toggle Completed */}
        <TouchableOpacity
          onPress={() => setShowCompleted(!showCompleted)}
          style={[
            styles.completedPill,
            {
              backgroundColor: showCompleted ? colors.surfaceContainer : 'transparent',
              borderColor: colors.cardBorder,
            },
          ]}>
          <Ionicons
            name={showCompleted ? 'checkbox-outline' : 'square-outline'}
            size={13}
            color={colors.textSecondary}
          />
          <Text style={[styles.completedPillText, { color: colors.textSecondary }]}>
            Done ({commitments.filter((c) => c.completed).length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Overdue / Urgent Alert Banner */}
      {overdueCount > 0 ? (
        <View style={[styles.urgentBanner, { backgroundColor: colors.warningSoft, borderColor: colors.warning }]}>
          <Ionicons name="alarm-outline" size={16} color={colors.warning} />
          <Text style={[styles.urgentBannerText, { color: colors.warning }]}>
            <Text style={{ fontWeight: '700' }}>{overdueCount} commitment(s)</Text> require attention today!
          </Text>
        </View>
      ) : null}

      {/* Filter Tabs */}
      {allowFilter ? (
        <View style={[styles.tabsRow, { backgroundColor: colors.surfaceRaised }]}>
          <TouchableOpacity
            onPress={() => setActiveDirection('all')}
            style={[
              styles.tabBtn,
              {
                backgroundColor:
                  activeDirection === 'all' ? colors.primaryTonal : 'transparent',
              },
            ]}>
            <Text
              style={[
                styles.tabBtnText,
                { color: activeDirection === 'all' ? colors.onPrimaryTonal : colors.textSoft },
              ]}>
              All ({commitments.filter((c) => !c.completed).length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveDirection('i_owe')}
            style={[
              styles.tabBtn,
              {
                backgroundColor:
                  activeDirection === 'i_owe' ? colors.primaryTonal : 'transparent',
              },
            ]}>
            <Ionicons
              name="arrow-up-circle-outline"
              size={13}
              color={activeDirection === 'i_owe' ? colors.onPrimaryTonal : colors.textSoft}
            />
            <Text
              style={[
                styles.tabBtnText,
                { color: activeDirection === 'i_owe' ? colors.onPrimaryTonal : colors.textSoft },
              ]}>
              I Owe ({iOweCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveDirection('they_owe_me')}
            style={[
              styles.tabBtn,
              {
                backgroundColor:
                  activeDirection === 'they_owe_me' ? colors.primaryTonal : 'transparent',
              },
            ]}>
            <Ionicons
              name="arrow-down-circle-outline"
              size={13}
              color={activeDirection === 'they_owe_me' ? colors.onPrimaryTonal : colors.textSoft}
            />
            <Text
              style={[
                styles.tabBtnText,
                { color: activeDirection === 'they_owe_me' ? colors.onPrimaryTonal : colors.textSoft },
              ]}>
              They Owe Me ({theyOweMeCount})
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Commitments List */}
      <View style={styles.listCol}>
        {filtered.length === 0 ? (
          <View style={[styles.emptyBox, { backgroundColor: colors.surfaceContainerLow }]}>
            <Ionicons name="checkmark-done-circle-outline" size={28} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {activeDirection === 'i_owe'
                ? 'No outstanding commitments you owe.'
                : activeDirection === 'they_owe_me'
                ? 'No pending promises owed to you.'
                : 'All detected commitments are cleared!'}
            </Text>
          </View>
        ) : (
          filtered.map((item) => {
            const isIOwe = item.direction === 'i_owe';
            const phraseLower = (item.deadlinePhrase || '').toLowerCase();
            const isDueToday = phraseLower.includes('today') || (item.dueDate && item.dueDate === new Date().toISOString().slice(0, 10));
            const isTomorrow = phraseLower.includes('tomorrow');
            const isOverdue = phraseLower.includes('yesterday') || phraseLower.includes('urgent') || phraseLower.includes('overdue');

            return (
              <View
                key={item.id}
                style={[
                  styles.itemRow,
                  {
                    backgroundColor: item.completed
                      ? colors.surfaceContainerLow
                      : colors.surfaceContainerLowest,
                    borderColor: item.completed ? colors.cardBorder : isIOwe ? colors.primary : colors.success,
                    opacity: item.completed ? 0.6 : 1,
                  },
                ]}>
                {/* Checkbox (22px circle, 1.5px borderStrong, filled success when done) */}
                <TouchableOpacity
                  onPress={() => onToggleCommitment(item.id)}
                  style={[
                    styles.checkboxBtn,
                    {
                      backgroundColor: item.completed
                        ? colors.success
                        : 'transparent',
                      borderColor: item.completed ? colors.success : colors.borderStrong,
                    },
                  ]}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: item.completed }}>
                  {item.completed && <Ionicons name="checkmark" size={14} color={colors.onSuccessTonal} />}
                </TouchableOpacity>

                {/* Content */}
                <View style={styles.itemContent}>
                  {/* Direction Badge & Who */}
                  <View style={styles.itemTopLine}>
                    <View
                      style={[
                        styles.directionPill,
                        {
                          backgroundColor: isOverdue
                            ? colors.dangerSoft
                            : isIOwe
                            ? colors.primarySoft
                            : colors.successSoft,
                        },
                      ]}>
                      <Ionicons
                        name={isIOwe ? 'arrow-up' : 'arrow-down'}
                        size={10}
                        color={isOverdue ? colors.danger : isIOwe ? colors.primary : colors.success}
                      />
                      <Text
                        style={[
                          styles.directionPillText,
                          { color: isOverdue ? colors.danger : isIOwe ? colors.primary : colors.success },
                        ]}>
                        {isIOwe ? `I Owe → ${item.person}` : `${item.speaker} Owes Me`}
                      </Text>
                    </View>

                    {/* Deadline Pill */}
                    {item.deadlinePhrase ? (
                      <View
                        style={[
                          styles.deadlineBadge,
                          {
                            backgroundColor: isOverdue
                              ? colors.dangerSoft
                              : isDueToday || isTomorrow
                              ? colors.warningSoft
                              : colors.surfaceRaised,
                            borderColor: isOverdue
                              ? colors.danger
                              : isDueToday || isTomorrow
                              ? colors.warning
                              : colors.border,
                          },
                        ]}>
                        <Ionicons
                          name="time-outline"
                          size={11}
                          color={
                            isOverdue
                              ? colors.danger
                              : isDueToday || isTomorrow
                              ? colors.warning
                              : colors.textSoft
                          }
                        />
                        <Text
                          style={[
                            styles.deadlineBadgeText,
                            {
                              color: isOverdue
                                ? colors.danger
                                : isDueToday || isTomorrow
                                ? colors.warning
                                : colors.textSoft,
                            },
                          ]}>
                          {item.deadlinePhrase}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Promise description */}
                  <Text
                    style={[
                      styles.promiseText,
                      {
                        color: colors.text,
                        textDecorationLine: item.completed ? 'line-through' : 'none',
                      },
                    ]}>
                    "{item.promise}"
                  </Text>

                  {/* Audio Evidence Citation Link */}
                  {item.evidence ? (
                    <View style={styles.evidenceWrap}>
                      <EvidenceTag
                        evidence={item.evidence}
                        onPressEvidence={onPressEvidence}
                        compact
                      />
                    </View>
                  ) : null}
                </View>

                {/* Optional Delete Button */}
                {onDeleteCommitment ? (
                  <TouchableOpacity
                    onPress={() => onDeleteCommitment(item.id)}
                    style={styles.deleteBtn}
                    accessibilityLabel="Delete commitment">
                    <Ionicons name="trash-outline" size={14} color={colors.textMuted} />
                  </TouchableOpacity>
                ) : null}
              </View>
            );
          })
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    marginVertical: 6,
    elevation: 0,
    shadowOpacity: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'transparent',
    flex: 1,
  },
  radarIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTexts: {
    backgroundColor: 'transparent',
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  completedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    height: 28,
    borderRadius: 999,
    borderWidth: 1,
  },
  completedPillText: {
    fontSize: 11,
    fontWeight: '500',
  },
  urgentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  urgentBannerText: {
    fontSize: 12,
    flex: 1,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 4,
    padding: 4,
    borderRadius: 10,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    height: 28,
    borderRadius: 999,
  },
  tabBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  listCol: {
    gap: 10,
    backgroundColor: 'transparent',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 14,
    gap: 6,
  },
  emptyText: {
    fontSize: 12,
    textAlign: 'center',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  checkboxBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  itemContent: {
    flex: 1,
    backgroundColor: 'transparent',
    gap: 4,
  },
  itemTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    gap: 6,
  },
  directionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    height: 24,
    borderRadius: 999,
  },
  directionPillText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  deadlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    height: 24,
    borderRadius: 999,
    borderWidth: 1,
  },
  deadlineBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  promiseText: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  evidenceWrap: {
    marginTop: 2,
    backgroundColor: 'transparent',
  },
  deleteBtn: {
    padding: 4,
  },
});
