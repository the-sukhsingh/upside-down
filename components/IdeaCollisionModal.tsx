import React, { useState } from 'react';
import {
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  View as RNView,
  SafeAreaView,
} from 'react-native';
import { Text, View } from './Themed';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from './useColorScheme';
import { useMeetingStore } from '@/store/meetingStore';
import { IdeaCollisionCard } from './IdeaCollisionCard';
import { ideaCollisionService } from '@/services/ideaCollisionService';
import { IdeaCollisionSourceNote } from '@/types/meeting';

interface IdeaCollisionModalProps {
  visible: boolean;
  onClose: () => void;
  onOpenSourceNote?: (note: IdeaCollisionSourceNote) => void;
}

type FilterTab = 'all' | 'saved' | 'experimenting';

export function IdeaCollisionModal({
  visible,
  onClose,
  onOpenSourceNote,
}: IdeaCollisionModalProps) {
  const theme = useColorScheme();
  const colors = Colors[theme];

  const {
    ideaCollisions,
    isCollidingIdeas,
    dismissIdeaCollision,
    saveIdeaCollision,
    setIdeaCollisionExperimenting,
  } = useMeetingStore();

  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await ideaCollisionService.generateCollisions();
    } catch (err) {
      console.error('Error generating idea collisions:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredCollisions = ideaCollisions.filter((c) => {
    if (activeTab === 'saved') return c.status === 'saved';
    if (activeTab === 'experimenting') return c.status === 'experimenting';
    return true;
  });

  const savedCount = ideaCollisions.filter((c) => c.status === 'saved').length;
  const experimentCount = ideaCollisions.filter((c) => c.status === 'experimenting').length;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.surface,
              borderBottomColor: colors.border,
            },
          ]}>
          <View style={styles.headerTitleBox}>
            <View
              style={[
                styles.iconWrap,
                { backgroundColor: colors.primaryContainer },
              ]}>
              <Ionicons name="flash" size={18} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                Idea Collision Engine
              </Text>
              <Text
                style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                Synthesizing thoughts recorded weeks or months apart
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={onClose}
            style={[styles.closeBtn, { backgroundColor: colors.surfaceContainer }]}
            accessibilityLabel="Close modal">
            <Ionicons name="close" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Action Toolbar */}
        <View
          style={[
            styles.toolbar,
            {
              backgroundColor: colors.surface,
              borderBottomColor: colors.cardBorder,
            },
          ]}>
          {/* Tab Filters */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsRow}>
            <TouchableOpacity
              onPress={() => setActiveTab('all')}
              style={[
                styles.tabBtn,
                activeTab === 'all' && {
                  backgroundColor: colors.primaryContainer,
                  borderColor: colors.primary,
                },
                activeTab !== 'all' && {
                  backgroundColor: colors.surfaceContainer,
                  borderColor: 'transparent',
                },
              ]}>
              <Text
                style={[
                  styles.tabText,
                  {
                    color:
                      activeTab === 'all' ? colors.primary : colors.textSecondary,
                  },
                ]}>
                All Ideas ({ideaCollisions.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab('saved')}
              style={[
                styles.tabBtn,
                activeTab === 'saved' && {
                  backgroundColor: colors.primaryContainer,
                  borderColor: colors.primary,
                },
                activeTab !== 'saved' && {
                  backgroundColor: colors.surfaceContainer,
                  borderColor: 'transparent',
                },
              ]}>
              <Ionicons
                name="bookmark"
                size={12}
                color={
                  activeTab === 'saved' ? colors.primary : colors.textSecondary
                }
              />
              <Text
                style={[
                  styles.tabText,
                  {
                    color:
                      activeTab === 'saved' ? colors.primary : colors.textSecondary,
                  },
                ]}>
                Saved ({savedCount})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab('experimenting')}
              style={[
                styles.tabBtn,
                activeTab === 'experimenting' && {
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  borderColor: '#10B981',
                },
                activeTab !== 'experimenting' && {
                  backgroundColor: colors.surfaceContainer,
                  borderColor: 'transparent',
                },
              ]}>
              <Ionicons
                name="flask"
                size={12}
                color={activeTab === 'experimenting' ? '#059669' : colors.textSecondary}
              />
              <Text
                style={[
                  styles.tabText,
                  {
                    color:
                      activeTab === 'experimenting'
                        ? '#059669'
                        : colors.textSecondary,
                  },
                ]}>
                Testing ({experimentCount})
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Collide CTA */}
          <TouchableOpacity
            onPress={handleGenerate}
            disabled={isGenerating || isCollidingIdeas}
            style={[
              styles.collideCtaBtn,
              {
                backgroundColor: colors.primary,
                opacity: isGenerating || isCollidingIdeas ? 0.7 : 1,
              },
            ]}>
            {isGenerating || isCollidingIdeas ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="sparkles" size={14} color="#FFFFFF" />
            )}
            <Text style={styles.collideCtaText}>
              {isGenerating || isCollidingIdeas ? 'Colliding...' : 'Collide Ideas'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Collisions Content List */}
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}>
          {filteredCollisions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View
                style={[
                  styles.emptyIconCircle,
                  { backgroundColor: colors.surfaceContainer },
                ]}>
                <Ionicons
                  name="git-compare-outline"
                  size={36}
                  color={colors.textMuted}
                />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {activeTab === 'saved'
                  ? 'No Saved Breakthroughs Yet'
                  : activeTab === 'experimenting'
                  ? 'No Active Experiments'
                  : 'No Active Idea Collisions'}
              </Text>
              <Text
                style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                {activeTab === 'all'
                  ? 'Tap "Collide Ideas" to discover non-obvious shared mechanisms between notes recorded weeks apart.'
                  : 'Bookmark breakthroughs or start experiments from the Idea Collision engine.'}
              </Text>

              <TouchableOpacity
                onPress={handleGenerate}
                disabled={isGenerating || isCollidingIdeas}
                style={[
                  styles.emptyActionBtn,
                  { backgroundColor: colors.primary },
                ]}>
                <Ionicons name="flash" size={16} color="#FFFFFF" />
                <Text style={styles.emptyActionText}>
                  Synthesize Connections Now
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
                onStartExperiment={(id) => {
                  setIdeaCollisionExperimenting(id);
                }}
                onPressSourceNote={(source) => {
                  onClose();
                  if (onOpenSourceNote) {
                    onOpenSourceNote(source);
                  }
                }}
              />
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    backgroundColor: 'transparent',
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 10,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'transparent',
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  collideCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  collideCtaText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
    backgroundColor: 'transparent',
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
  },
  emptyActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
