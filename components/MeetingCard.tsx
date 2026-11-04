import React, { memo } from 'react';
import { StyleSheet, Pressable, TouchableOpacity, Share } from 'react-native';
import { Text, View } from './Themed';
import { Ionicons } from '@expo/vector-icons';
import { Meeting } from '@/types/meeting';
import Colors from '@/constants/Colors';
import { semantic } from '@/constants/theme';
import { useColorScheme } from './useColorScheme';

interface MeetingCardProps {
  meeting: Meeting;
  onPress?: () => void;
  onRecordPress?: () => void;
  onInvitePress?: () => void;
  isCurrentlyRecording?: boolean;
}

const AVATAR_COLORS = [semantic.primary, semantic.success, semantic.textFaint, semantic.primaryTonal, semantic.warning];

function getInitials(name: string): string {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const MeetingCard = memo(function MeetingCard({
  meeting,
  onPress,
  onRecordPress,
  onInvitePress,
  isCurrentlyRecording = false,
}: MeetingCardProps) {
  const theme = useColorScheme();
  const colors = Colors[theme];

  const hasRecording = meeting.recordingIds && meeting.recordingIds.length > 0;
  const meetingUrl = meeting.meetingUrl || `https://meetanotes.io/${meeting.id.replace('meet-', '')}`;

  const handleShare = async () => {
    if (onInvitePress) {
      onInvitePress();
      return;
    }
    try {
      await Share.share({
        title: meeting.title,
        message: `Join meeting "${meeting.title}" on MeetaNotes: ${meetingUrl}`,
        url: meetingUrl,
      });
    } catch {
      // Ignored
    }
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: isCurrentlyRecording ? colors.coralLight : colors.surface,
          borderColor: isCurrentlyRecording ? colors.coral : colors.border,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
      ]}>
      {/* Top Meta Row: Time & Duration + Three dots */}
      <View style={styles.topRow}>
        <View style={styles.timeRow}>
          <Text style={[styles.timeText, { color: colors.textSecondary }]}>
            {meeting.startTime.toLowerCase()} • {meeting.durationMinutes}min
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleShare}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={[styles.threeDotsBtn, { backgroundColor: colors.surfaceContainer }]}>
          <Ionicons name="ellipsis-horizontal" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Meeting Title */}
      <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
        {meeting.title}
      </Text>

      {/* MeetaNotes Meeting Link Chip */}
      <View style={[styles.linkChip, { backgroundColor: colors.surfaceContainer }]}>
        <Ionicons name="videocam-outline" size={14} color={colors.primary} style={{ marginRight: 6 }} />
        <Text style={[styles.linkText, { color: colors.textSecondary }]} numberOfLines={1}>
          {meetingUrl}
        </Text>
      </View>

      {/* Footer: Facepile on Left, Action on Right */}
      <View style={styles.footerRow}>
        {/* Attendee Facepile */}
        <View style={styles.facepileContainer}>
          {meeting.attendees.slice(0, 3).map((attendee, index) => {
            const avatarBg = AVATAR_COLORS[index % AVATAR_COLORS.length];
            return (
              <View
                key={attendee + index}
                style={[
                  styles.avatarCircle,
                  {
                    backgroundColor: avatarBg,
                    marginLeft: index === 0 ? 0 : -8,
                    borderColor: colors.surface,
                  },
                ]}>
                <Text style={styles.avatarInitials}>{getInitials(attendee)}</Text>
              </View>
            );
          })}

          {meeting.attendees.length > 3 && (
            <View
              style={[
                styles.extraAttendeesBadge,
                {
                  backgroundColor: colors.surfaceContainerHigh,
                  marginLeft: -8,
                  borderColor: colors.surface,
                },
              ]}>
              <Text style={[styles.extraAttendeesText, { color: colors.textSecondary }]}>
                +{meeting.attendees.length - 3}
              </Text>
            </View>
          )}

          {meeting.attendees.length === 0 && (
            <Text style={[styles.noAttendeesText, { color: colors.textMuted }]}>
              No attendees
            </Text>
          )}
        </View>

        {/* Action Button Group */}
        <View style={styles.actionBtnGroup}>
          <TouchableOpacity
            onPress={onPress}
            style={[styles.briefingBtn, { backgroundColor: colors.surfaceContainer, borderColor: colors.cardBorder }]}>
            <Ionicons name="sparkles" size={11} color={colors.primary} />
            <Text style={[styles.briefingBtnText, { color: colors.primary }]}>
              {meeting.briefing ? 'Briefing Ready' : 'Briefing'}
            </Text>
          </TouchableOpacity>

          {onRecordPress ? (
            <TouchableOpacity
              onPress={onRecordPress}
              style={[
                styles.actionBtn,
                {
                  backgroundColor: isCurrentlyRecording
                    ? colors.danger
                    : hasRecording
                    ? colors.surfaceRaised
                    : colors.primaryTonal,
                },
              ]}>
              <Ionicons
                name={isCurrentlyRecording ? 'radio' : hasRecording ? 'document-text-outline' : 'mic'}
                size={13}
                color={
                  isCurrentlyRecording
                    ? colors.onPrimaryStrong
                    : hasRecording
                    ? colors.textSoft
                    : colors.onPrimaryTonal
                }
                style={{ marginRight: 5 }}
              />
              <Text
                style={[
                  styles.actionBtnText,
                  {
                    color: isCurrentlyRecording
                      ? colors.onPrimaryStrong
                      : hasRecording
                      ? colors.textSoft
                      : colors.onPrimaryTonal,
                  },
                ]}>
                {isCurrentlyRecording ? 'Live' : hasRecording ? 'View Note' : 'Record'}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    elevation: 0,
    shadowOpacity: 0,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    backgroundColor: 'transparent',
  },
  timeRow: {
    backgroundColor: 'transparent',
  },
  timeText: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  threeDotsBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.2,
    lineHeight: 24,
    marginBottom: 10,
  },
  linkChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 28,
    borderRadius: 999,
    marginBottom: 12,
  },
  linkText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  facepileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  avatarCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  avatarInitials: {
    fontSize: 10,
    fontWeight: '700',
    color: semantic.onInverted,
  },
  extraAttendeesBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  extraAttendeesText: {
    fontSize: 10,
    fontWeight: '700',
  },
  noAttendeesText: {
    fontSize: 11,
  },
  actionBtnGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'transparent',
  },
  briefingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 28,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  briefingBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 10,
    elevation: 0,
    shadowOpacity: 0,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
