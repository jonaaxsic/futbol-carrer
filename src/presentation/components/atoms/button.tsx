import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, radius, spacing } from '@/presentation/theme';

type ButtonProps = PressableProps & {
  label: string;
  style?: StyleProp<ViewStyle>;
  /** Para botones con contenido extra (ícono) además del label. */
  children?: ReactNode;
};

const sharedStyles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
  },
  label: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  disabled: { opacity: 0.35 },
  pressed: { opacity: 0.8 },
});

/**
 * Botón primario: fondo blanco, texto oscuro — el "CONTINUAR" del wireframe.
 */
export function PrimaryButton({ label, disabled, style, children, ...rest }: ButtonProps) {
  return (
    <Pressable
      disabled={disabled}
      style={({ pressed }) => [
        sharedStyles.base,
        { backgroundColor: colors.accent, borderColor: colors.accent },
        !disabled && pressed && sharedStyles.pressed,
        disabled && sharedStyles.disabled,
        style,
      ]}
      {...rest}>
      {children}
      <Text style={[sharedStyles.label, { color: colors.onAccent }]}>{label}</Text>
    </Pressable>
  );
}

/**
 * Botón secundario: contorno gris, texto blanco (el "VOLVER" del wireframe).
 */
export function SecondaryButton({ label, disabled, style, children, ...rest }: ButtonProps) {
  return (
    <Pressable
      disabled={disabled}
      style={({ pressed }) => [
        sharedStyles.base,
        { backgroundColor: 'transparent', borderColor: colors.border },
        !disabled && pressed && sharedStyles.pressed,
        disabled && sharedStyles.disabled,
        style,
      ]}
      {...rest}>
      {children}
      <Text style={[sharedStyles.label, { color: colors.textPrimary }]}>{label}</Text>
    </Pressable>
  );
}