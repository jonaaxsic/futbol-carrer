import type { ReactNode } from 'react';
import {
  Platform,
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
    paddingHorizontal: spacing.lg,
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
  // Mobile: stretch to fill width
  mobile: {
    alignSelf: 'stretch',
  },
  // Web: fixed width, centered
  web: {
    minWidth: 220,
    maxWidth: 300,
    alignSelf: 'center',
  },
});

export function PrimaryButton({ label, disabled, style, children, ...rest }: ButtonProps) {
  const platformStyle = Platform.OS === 'web' ? sharedStyles.web : sharedStyles.mobile;

  return (
    <Pressable
      disabled={disabled}
      style={({ pressed }) => [
        sharedStyles.base,
        platformStyle,
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

export function SecondaryButton({ label, disabled, style, children, ...rest }: ButtonProps) {
  const platformStyle = Platform.OS === 'web' ? sharedStyles.web : sharedStyles.mobile;

  return (
    <Pressable
      disabled={disabled}
      style={({ pressed }) => [
        sharedStyles.base,
        platformStyle,
        { backgroundColor: 'transparent', borderColor: colors.borderStrong },
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
