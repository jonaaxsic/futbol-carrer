import { Stack } from 'expo-router';

/** Grupo (auth): login → menú principal. Sin headers (diseño custom). */
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}