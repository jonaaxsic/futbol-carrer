import { StyleSheet, Text, type TextProps } from 'react-native';

import { colors, fontSize, spacing } from '@/presentation/theme';

export type AppTextVariant =
  | 'title'
  | 'heading'
  | 'subtitle'
  | 'body'
  | 'label'
  | 'caption';

type AppTextProps = TextProps & {
  variant?: AppTextVariant;
  color?: keyof typeof colors;
  uppercase?: boolean;
};

/** Texto tipográfico con variantes del sistema de diseño (tema oscuro). */
export function AppText({
  variant = 'body',
  color = 'textPrimary',
  uppercase = false,
  style,
  ...rest
}: AppTextProps) {
  return (
    <Text
      style={[
        styles.base,
        variants[variant],
        { color: colors[color] },
        uppercase && styles.uppercase,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  base: { fontSize: fontSize.md, lineHeight: 24 },
  uppercase: { textTransform: 'uppercase' },
});

const variants = StyleSheet.create({
  /** Título de pantalla (wireframe: mayúsculas, grande, peso fuerte) */
  title: {
    fontSize: fontSize.xl,
    lineHeight: 36,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  heading: {
    fontSize: fontSize.lg,
    lineHeight: 28,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: fontSize.md,
    lineHeight: 24,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  body: {
    fontSize: fontSize.md,
    lineHeight: 24,
  },
  label: {
    fontSize: fontSize.sm,
    lineHeight: 20,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  caption: {
    fontSize: fontSize.xs,
    lineHeight: 16,
    color: colors.textMuted,
  },
});
