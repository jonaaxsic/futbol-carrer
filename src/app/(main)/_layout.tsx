import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform, useWindowDimensions } from 'react-native';

import { colors, spacing } from '@/presentation/theme';

/**
 * Tab bar inferior de la carrera activa.
 * Responsive: web usa tab bar horizontal más ancha, mobile compacta.
 */
export default function MainTabsLayout() {
  const { width: screenWidth } = useWindowDimensions();
  const isWide = screenWidth > 600;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.textPrimary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: isWide ? 64 : 56,
          paddingBottom: isWide ? spacing.sm : spacing.xs,
          paddingTop: spacing.xs,
        },
        tabBarLabelStyle: {
          fontSize: isWide ? 13 : 11,
          fontWeight: '700',
          letterSpacing: 0.5,
        },
        tabBarIconStyle: {
          marginBottom: isWide ? -2 : 0,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={isWide ? size + 4 : size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="career"
        options={{
          title: 'Carrera',
          tabBarIcon: ({ color, size }) => <Ionicons name="flag" size={isWide ? size + 4 : size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Club',
          tabBarIcon: ({ color, size }) => <Ionicons name="shield" size={isWide ? size + 4 : size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: 'Eventos',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="newspaper" size={isWide ? size + 4 : size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={isWide ? size + 4 : size} color={color} />,
        }}
      />
      <Tabs.Screen name="club-oferta" options={{ href: null }} />
    </Tabs>
  );
}
