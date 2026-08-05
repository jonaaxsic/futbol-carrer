import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, useWindowDimensions, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/presentation/components/atoms/app-text';
import { colors, radius, spacing } from '@/presentation/theme';

/** Ancho máximo del contenido en web */
const CONTENT_MAX_WIDTH = 480;

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
 * Responsive: en web limita ancho máximo para evitar estiramiento.
 */
export function ScreenContainer({
  children,
  title,
  footer,
  scrollable = false,
  style,
  contentContainerStyle,
}: ScreenContainerProps) {
  const { width: screenWidth } = useWindowDimensions();

  // Calcular ancho responsive para web
  const maxWidthStyle: ViewStyle | undefined = Platform.OS === 'web'
    ? { maxWidth: Math.min(screenWidth - spacing.md * 2, CONTENT_MAX_WIDTH), alignSelf: 'center' as const, width: '100%' as const }
    : undefined;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {title != null && (
        <View style={[styles.header, maxWidthStyle]}>
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
          contentContainerStyle={[styles.content, maxWidthStyle, style, contentContainerStyle]}
          showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, maxWidthStyle, style]}>
          {children}
        </View>
      )}

      {footer != null && (
        <View style={[styles.footer, maxWidthStyle]}>
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
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    gap: spacing.sm,
    alignItems: 'center',
  },
});
