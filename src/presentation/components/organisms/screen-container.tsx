import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/presentation/components/atoms/app-text';
import { colors, radius, spacing } from '@/presentation/theme';

type ScreenContainerProps = {
  children: ReactNode;
  /** Si está presente, muestra header con flecha volver + título. */
  title?: string;
  /** Footer fijo al pie (VOLVER/CONTINUAR del wireframe). */
  footer?: ReactNode;
  /**
   * Habilita scroll vertical del contenido (pantallas largas: dashboard,
   * fixture). Activo SOLO si el contenido requiere scroll; el footer y el
   * header quedan fijos.
   */
  scrollable?: boolean;
  /** Estilo del contenedor de contenido (o del contentContainer del ScrollView). */
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
};

/**
 * Contenedor base de pantalla: fondo oscuro, safe area,
 * header opcional con volver (flecha) y footer opcional fijo.
 * Con `scrollable` el contenido va dentro de un ScrollView.
 */
export function ScreenContainer({
  children,
  title,
  footer,
  scrollable = false,
  style,
  contentContainerStyle,
}: ScreenContainerProps) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {title != null && (
        <View style={styles.header}>
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
          contentContainerStyle={[styles.content, style, contentContainerStyle]}
          showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, style]}>{children}</View>
      )}

      {footer != null && <View style={styles.footer}>{footer}</View>}
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
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    gap: spacing.sm,
    alignItems: 'center',
  },
});