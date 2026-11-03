import React from 'react';
import { Tabs } from 'expo-router';
import { MeetaTabBar } from '@/components/MeetaTabBar';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <MeetaTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="meetings"
        options={{
          title: 'Schedule',
        }}
      />
      <Tabs.Screen
        name="record"
        options={{
          title: 'Record',
        }}
      />
      <Tabs.Screen
        name="notes"
        options={{
          title: 'Notes',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
        }}
      />
    </Tabs>
  );
}

