import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" hidden />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0b0914' } }}>
        <Stack.Screen name="index" />
      </Stack>
    </>
  );
}
