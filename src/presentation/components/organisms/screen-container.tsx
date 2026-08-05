import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, useWindowDimensions, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/presentation/components/atoms/app-text';
import { colors, radius, spacing } from '@/presentation/theme';

/** Ancho máximo del contenido en web */
const CONTENT_MAX_WIDTH = 600;

type ScreenContainerProps = {
  children: ReactNode;
  title?: string;
  footer?: ReactNode;
  scrollable?: boolean;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
};

export function ScreenContainer({
  children,
  title,
  footer,
  scrollable = false,
  style,
  contentContainerStyle,
}: ScreenContainerProps) {
  const { width: screenWidth } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isWide = screenWidth > 600;

  const containerStyle: ViewStyle | undefined = isWeb
    ? {
        maxWidth: Math.min(screenWidth * 0.9, CONTENT_MAX_WIDTH),
        alignSelf: 'center',
        width: '100%',
      }
    : undefined;

  const footerStyle: ViewStyle = isWide
    ? { flexDirection: 'row', justifyContent: 'center', gap: spacing.md }
    : {};

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {title != null && (
        <View style={[styles.header, containerStyle]}>
          {title !== '' && (
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
              <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
            </Pressable>
          )}
          <AppText variant="heading" uppercase style={styles.headerTitle}>
            {title}
          </AppText>
          <View style={styles.headerSpacer} />
        </View>
      )}

      {scrollable ? (
        <ScrollView
          style={styles.scrollFlex}
          contentContainerStyle={[styles.content, containerStyle, style, contentContainerStyle]}
          showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, containerStyle, style]}>
          {children}
        </View>
      )}

      {footer != null && (
        <View style={[styles.footer, containerStyle, footerStyle]}>
          {footer}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollFlex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.6 },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    marginHorizontal: spacing.sm,
  },
  headerSpacer: { width: 40 },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  footer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
});
