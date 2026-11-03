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
        <View style={[styles.urgentBanner, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}>
          <Ionicons name="alarm-outline" size={16} color="#B45309" />
          <Text style={[styles.urgentBannerText, { color: '#92400E' }]}>
            <Text style={{ fontWeight: '700' }}>{overdueCount} commitment(s)</Text> require attention today!
          </Text>
        </View>
      ) : null}

      {/* Filter Tabs */}
      {allowFilter ? (
        <View style={styles.tabsRow}>
          <TouchableOpacity
            onPress={() => setActiveDirection('all')}
            style={[
              styles.tabBtn,
              {
                backgroundColor:
                  activeDirection === 'all' ? colors.primaryContainer : colors.surfaceContainerLow,
                borderColor: activeDirection === 'all' ? colors.primary : colors.cardBorder,
              },
            ]}>
            <Text
              style={[
                styles.tabBtnText,
                { color: activeDirection === 'all' ? colors.primary : colors.textSecondary },
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
                  activeDirection === 'i_owe' ? colors.primaryContainer : colors.surfaceContainerLow,
                borderColor: activeDirection === 'i_owe' ? colors.primary : colors.cardBorder,
              },
            ]}>
            <Ionicons
              name="arrow-up-circle-outline"
              size={13}
              color={activeDirection === 'i_owe' ? colors.primary : colors.textSecondary}
            />
            <Text
              style={[
                styles.tabBtnText,
                { color: activeDirection === 'i_owe' ? colors.primary : colors.textSecondary },
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
                  activeDirection === 'they_owe_me' ? colors.secondaryContainer : colors.surfaceContainerLow,
                borderColor: activeDirection === 'they_owe_me' ? colors.secondary : colors.cardBorder,
              },
            ]}>
            <Ionicons
              name="arrow-down-circle-outline"
              size={13}
              color={activeDirection === 'they_owe_me' ? colors.secondary : colors.textSecondary}
            />
            <Text
              style={[
                styles.tabBtnText,
                { color: activeDirection === 'they_owe_me' ? colors.secondary : colors.textSecondary },
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
            const isDueToday =
              (item.deadlinePhrase || '').toLowerCase().includes('today') ||
              (item.dueDate && item.dueDate === new Date().toISOString().slice(0, 10));

            return (
              <View
                key={item.id}
                style={[
                  styles.itemRow,
                  {
                    backgroundColor: item.completed
                      ? colors.surfaceContainerLow
                      : colors.surfaceContainerLowest,
                    borderColor: item.completed ? colors.cardBorder : isIOwe ? colors.primary : colors.secondary,
                    opacity: item.completed ? 0.6 : 1,
                  },
                ]}>
                {/* Checkbox */}
                <TouchableOpacity
                  onPress={() => onToggleCommitment(item.id)}
                  style={[
                    styles.checkboxBtn,
                    {
                      backgroundColor: item.completed
                        ? colors.tint
                        : colors.surfaceContainer,
                      borderColor: item.completed ? colors.tint : colors.border,
                    },
                  ]}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: item.completed }}>
                  {item.completed && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                </TouchableOpacity>

                {/* Content */}
                <View style={styles.itemContent}>
                  {/* Direction Badge & Who */}
                  <View style={styles.itemTopLine}>
                    <View
                      style={[
                        styles.directionPill,
                        {
                          backgroundColor: isIOwe ? colors.primaryContainer : colors.secondaryContainer,
                        },
                      ]}>
                      <Ionicons
                        name={isIOwe ? 'arrow-up' : 'arrow-down'}
                        size={10}
                        color={isIOwe ? colors.primary : colors.secondary}
                      />
                      <Text
                        style={[
                          styles.directionPillText,
                          { color: isIOwe ? colors.primary : colors.secondary },
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
                            backgroundColor: isDueToday ? '#FEF3C7' : colors.surfaceContainer,
                            borderColor: isDueToday ? '#F59E0B' : colors.cardBorder,
                          },
                        ]}>
                        <Ionicons
                          name="time-outline"
                          size={11}
                          color={isDueToday ? '#B45309' : colors.textSecondary}
                        />
                        <Text
                          style={[
                            styles.deadlineBadgeText,
                            { color: isDueToday ? '#B45309' : colors.textSecondary },
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
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    marginVertical: 6,
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
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTexts: {
    backgroundColor: 'transparent',
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
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
    gap: 8,
    backgroundColor: 'transparent',
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
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
    borderRadius: 12,
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
    borderRadius: 12,
    borderWidth: 1,
  },
  checkboxBtn: {
    width: 20,
    height: 20,
    borderRadius: 6,
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
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
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
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
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
