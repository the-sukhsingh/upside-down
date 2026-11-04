import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Text, View } from '@/components/Themed';
import { useMeetingStore } from '@/store/meetingStore';
import { IdeaCollisionCard } from '@/components/IdeaCollisionCard';
import { ideaCollisionService } from '@/services/ideaCollisionService';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

type FilterCategory = 'all' | 'collisions' | 'actions' | 'audio';

export default function NotesScreen() {
  const router = useRouter();
  const theme = useColorScheme();
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();

  const {
    recordings,
    ideaCollisions,
    isCollidingIdeas,
    dismissIdeaCollision,
    saveIdeaCollision,
    setIdeaCollisionExperimenting,
  } = useMeetingStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterCategory>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isGeneratingCollisions, setIsGeneratingCollisions] = useState(false);

  const handleCollideIdeas = async () => {
    setIsGeneratingCollisions(true);
    try {
      await ideaCollisionService.generateCollisions();
    } catch (err) {
      console.error('Error generating collisions:', err);
    } finally {
      setIsGeneratingCollisions(false);
    }
  };

  const filteredCollisions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return ideaCollisions;
    return ideaCollisions.filter(
      (c) =>
        c.title.toLowerCase().includes(query) ||
        c.sharedMechanism.toLowerCase().includes(query) ||
        c.whyUseful.toLowerCase().includes(query) ||
        c.overlappingConcepts.some((t) => t.toLowerCase().includes(query)) ||
        c.sourceNotes.some((s) => s.meetingTitle.toLowerCase().includes(query))
    );
  }, [ideaCollisions, searchQuery]);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    recordings.forEach((r) => {
      r.tags?.forEach((t) => tagSet.add(t));
    });
    return Array.from(tagSet);
  }, [recordings]);

  const filteredRecordings = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return recordings.filter((rec) => {
      if (selectedTag && (!rec.tags || !rec.tags.includes(selectedTag))) {
        return false;
      }

      if (selectedFilter === 'actions') {
        const hasActions = Boolean(rec.summary?.actionItems && rec.summary.actionItems.length > 0);
        if (!hasActions) return false;
      } else if (selectedFilter === 'audio') {
        if (!rec.uri) return false;
      }

      if (!query) return true;

      const titleMatch = rec.meetingTitle.toLowerCase().includes(query);
      const summaryMatch = rec.summary?.executiveSummary?.toLowerCase().includes(query);
      const decisionsMatch = rec.summary?.keyDecisions?.some((d) => d.toLowerCase().includes(query));
      const actionsMatch = rec.summary?.actionItems?.some((a) => a.task.toLowerCase().includes(query));
      const transcriptMatch = rec.transcript?.toLowerCase().includes(query);
      const tagsMatch = rec.tags?.some((t) => t.toLowerCase().includes(query));

      return Boolean(
        titleMatch ||
        summaryMatch ||
        decisionsMatch ||
        actionsMatch ||
        transcriptMatch ||
        tagsMatch
      );
    });
  }, [recordings, searchQuery, selectedFilter, selectedTag]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs > 0 ? `${secs}s` : ''}`;
  };

  const formatDateLabel = (isoDate: string) => {
    try {
      const date = new Date(isoDate);
      const now = new Date();
      const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

      if (diffHours < 24 && date.getDate() === now.getDate()) {
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return `Today · ${timeStr}`;
      } else if (diffHours < 48 && date.getDate() === now.getDate() - 1) {
        return 'Yesterday';
      }
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return 'Recent';
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerTitleRow}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Meeting Notes</Text>
          <Text style={[styles.headerCount, { color: colors.textSecondary }]}>
            {recordings.length} {recordings.length === 1 ? 'note' : 'notes'}
          </Text>
        </View>

        {/* Search Bar */}
        <View
          style={[
            styles.searchBarContainer,
            { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border },
          ]}>
          <Ionicons name="search" size={17} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search notes, summaries, action items..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filter Tabs */}
        <View style={[styles.filterTabsRow, { backgroundColor: colors.surfaceContainerHighest }]}>
          {(['all', 'collisions', 'actions', 'audio'] as FilterCategory[]).map((tab) => {
            const isSelected = selectedFilter === tab;
            const label =
              tab === 'all'
                ? 'All Notes'
                : tab === 'collisions'
                ? `Collisions ⚡ (${ideaCollisions.length})`
                : tab === 'actions'
                ? 'Has Tasks'
                : 'Audio';
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setSelectedFilter(tab)}
                style={[
                  styles.filterTab,
                  isSelected && {
                    backgroundColor: colors.primaryTonal,
                  },
                  !isSelected && {
                    backgroundColor: 'transparent',
                  },
                ]}>
                <Text
                  style={[
                    styles.filterTabText,
                    { color: isSelected ? colors.onPrimaryTonal : colors.textSecondary },
                  ]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Tag Pills */}
        {allTags.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagScroll}>
            <View style={styles.tagContainer}>
              {allTags.map((tag) => {
                const isSelected = selectedTag === tag;
                return (
                  <TouchableOpacity
                    key={tag}
                    onPress={() => setSelectedTag(isSelected ? null : tag)}
                    style={[
                      styles.tagChip,
                      {
                        backgroundColor: isSelected
                          ? colors.secondaryContainer
                          : colors.surfaceContainer,
                        borderColor: isSelected ? colors.secondary : 'transparent',
                      },
                    ]}>
                    <Text
                      style={[
                        styles.tagChipText,
                        { color: isSelected ? colors.secondary : colors.textSecondary },
                      ]}>
                      #{tag}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        )}
      </View>

      {/* Notes / Collisions List */}
      <ScrollView
        contentContainerStyle={[styles.notesList, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}>
        {selectedFilter === 'collisions' ? (
          <View style={styles.collisionsContainer}>
            {/* Engine Header Card */}
            <View
              style={[
                styles.collisionHeaderCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.cardBorder,
                },
              ]}>
              <View style={styles.collisionHeaderCardLeft}>
                <View
                  style={[
                    styles.collisionIconBox,
                    { backgroundColor: colors.primaryContainer },
                  ]}
                >
                  <Ionicons name="flash" size={18} color={colors.primary} />
                </View>
                <View style={styles.collisionHeaderTextCol}>
                  <Text style={[styles.collisionHeaderCardTitle, { color: colors.text }]}>
                    Idea Collision Engine
                  </Text>
                  <Text
                    style={[
                      styles.collisionHeaderCardSub,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Latent cross-domain connections & testable experiments
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={handleCollideIdeas}
                disabled={isGeneratingCollisions || isCollidingIdeas}
                style={[
                  styles.collideActionBtn,
                  {
                    backgroundColor: colors.primaryTonal,
                    opacity: isGeneratingCollisions || isCollidingIdeas ? 0.7 : 1,
                  },
                ]}
              >
                {isGeneratingCollisions || isCollidingIdeas ? (
                  <ActivityIndicator size="small" color={colors.onPrimaryTonal} />
                ) : (
                  <Ionicons name="sparkles" size={14} color={colors.onPrimaryTonal} />
                )}
                <Text style={[styles.collideActionBtnText, { color: colors.onPrimaryTonal }]}>
                  {isGeneratingCollisions || isCollidingIdeas ? 'Colliding...' : 'Collide'}
                </Text>
              </TouchableOpacity>
            </View>

            {filteredCollisions.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="git-compare-outline" size={48} color={colors.textMuted} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  No Idea Collisions Found
                </Text>
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                  {searchQuery
                    ? 'No collisions match your search query.'
                    : 'Tap "Collide" to synthesize new connections between your thoughts.'}
                </Text>
                <TouchableOpacity
                  onPress={handleCollideIdeas}
                  disabled={isGeneratingCollisions || isCollidingIdeas}
                  style={[styles.recordCtaBtn, { backgroundColor: colors.primaryTonal }]}
                >
                  <Ionicons name="flash" size={16} color={colors.onPrimaryTonal} />
                  <Text style={[styles.recordCtaBtnText, { color: colors.onPrimaryTonal }]}>
                    Synthesize Now
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              filteredCollisions.map((collision) => (
                <IdeaCollisionCard
                  key={collision.id}
                  collision={collision}
                  onDismiss={(id) => dismissIdeaCollision(id)}
                  onSave={(id) => saveIdeaCollision(id)}
                  onStartExperiment={(id) => setIdeaCollisionExperimenting(id)}
                />
              ))
            )}
          </View>
        ) : (
          <>
            {/* Quick banner linking to Idea Collisions */}
            {selectedFilter === 'all' && !searchQuery && ideaCollisions.length > 0 && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setSelectedFilter('collisions')}
                style={[
                  styles.quickCollisionBanner,
                  {
                    backgroundColor: colors.primaryContainer,
                    borderColor: colors.primary,
                  },
                ]}
              >
                <View style={styles.quickCollisionLeft}>
                  <Ionicons name="flash" size={16} color={colors.primary} />
                  <View style={styles.quickCollisionTextCol}>
                    <Text style={[styles.quickCollisionTitle, { color: colors.primary }]}>
                      {ideaCollisions.length} Idea Collisions Discovered
                    </Text>
                    <Text style={[styles.quickCollisionSub, { color: colors.textSecondary }]}>
                      Tap to view synthesized connections across your past notes
                    </Text>
                  </View>
                </View>
                <Ionicons name="arrow-forward" size={16} color={colors.primary} />
              </TouchableOpacity>
            )}

            {filteredRecordings.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="document-text-outline" size={48} color={colors.textMuted} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No Notes Found</Text>
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                  {searchQuery
                    ? 'Try a different search term or clear filters.'
                    : 'Tap Record to capture your first meeting audio and generate notes.'}
                </Text>
                <TouchableOpacity
                  onPress={() => router.push('/record')}
                  style={[styles.recordCtaBtn, { backgroundColor: colors.primary }]}
                >
                  <Ionicons name="mic" size={16} color={colors.primaryText} />
                  <Text style={[styles.recordCtaBtnText, { color: colors.primaryText }]}>
                    Record Note
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              filteredRecordings.map((rec) => {
                const actionCount = rec.summary?.actionItems?.length || 0;
                const completedActionCount =
                  rec.summary?.actionItems?.filter((a) => a.done).length || 0;

                return (
                  <TouchableOpacity
                    key={rec.id}
                    activeOpacity={0.8}
                    onPress={() => router.push(`/notes/${rec.id}`)}
                    style={[
                      styles.noteCard,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                    ]}
                  >
                {/* Meta row */}
                <View style={styles.noteCardTopRow}>
                  <Text style={[styles.noteDate, { color: colors.textSecondary }]}>
                    {formatDateLabel(rec.createdAt)}
                  </Text>
                  <View style={[styles.durationBadge, { backgroundColor: colors.surfaceContainer }]}>
                    <Ionicons name="mic-outline" size={12} color={colors.textSecondary} />
                    <Text style={[styles.durationText, { color: colors.textSecondary }]}>
                      {formatDuration(rec.durationSeconds)}
                    </Text>
                  </View>
                </View>

                {/* Title */}
                <Text style={[styles.noteTitle, { color: colors.text }]} numberOfLines={2}>
                  {rec.meetingTitle}
                </Text>

                {/* Executive Summary Preview */}
                {rec.summary?.executiveSummary && (
                  <Text
                    style={[styles.noteSummaryPreview, { color: colors.textSecondary }]}
                    numberOfLines={2}>
                    {rec.summary.executiveSummary}
                  </Text>
                )}

                {/* Bottom Row: Actions count & Tags */}
                <View style={styles.noteBottomRow}>
                  {actionCount > 0 ? (
                    <View
                      style={[
                        styles.actionsBadge,
                        { backgroundColor: colors.surfaceContainerLow },
                      ]}>
                      <Ionicons
                        name={
                          completedActionCount === actionCount
                            ? 'checkmark-done-circle'
                            : 'checkbox-outline'
                        }
                        size={14}
                        color={colors.secondary}
                      />
                      <Text
                        style={[
                          styles.actionsBadgeText,
                          { color: colors.secondary },
                        ]}>
                        {completedActionCount}/{actionCount} tasks
                      </Text>
                    </View>
                  ) : (
                    <View />
                  )}

                  <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                </View>
              </TouchableOpacity>
            );
          })
        )}
          </>
        )}
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
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    gap: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  headerCount: {
    fontSize: 13,
    fontWeight: '500',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  filterTabsRow: {
    flexDirection: 'row',
    gap: 6,
    borderRadius: 10,
    padding: 4,
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tagScroll: {
    marginTop: -2,
  },
  tagContainer: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: 'transparent',
  },
  tagChip: {
    paddingHorizontal: 12,
    height: 28,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  tagChipText: {
    fontSize: 11,
    fontWeight: '500',
  },
  notesList: {
    padding: 16,
    gap: 12,
  },
  noteCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    gap: 10,
    elevation: 0,
    shadowOpacity: 0,
  },
  noteCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  noteDate: {
    fontSize: 12,
    fontWeight: '500',
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  durationText: {
    fontSize: 11,
    fontWeight: '600',
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  noteSummaryPreview: {
    fontSize: 13,
    lineHeight: 18,
  },
  noteBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    marginTop: 2,
  },
  actionsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  actionsBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  quickCollisionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 4,
  },
  quickCollisionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    backgroundColor: 'transparent',
  },
  quickCollisionTextCol: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  quickCollisionTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  quickCollisionSub: {
    fontSize: 11,
    marginTop: 2,
  },
  collisionsContainer: {
    gap: 12,
    backgroundColor: 'transparent',
  },
  collisionHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 4,
  },
  collisionHeaderCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    backgroundColor: 'transparent',
  },
  collisionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  collisionHeaderTextCol: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  collisionHeaderCardTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  collisionHeaderCardSub: {
    fontSize: 11,
    marginTop: 2,
  },
  collideActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 10,
  },
  collideActionBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    gap: 10,
    backgroundColor: 'transparent',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 8,
  },
  recordCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 10,
  },
  recordCtaBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

