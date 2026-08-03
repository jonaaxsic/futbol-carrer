import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import type { Club } from '@/domain/entities/club';
import { CAREER_START_AGE, OVR_START } from '@/shared/constants/game';
import { clubRepository } from '@/data/repositories/club-repository';
import { iniciarCarrera } from '@/services/careerService';
import { useOnboardingStore } from '@/state/useOnboardingStore';
import { usePlayerStore } from '@/state/usePlayerStore';
import { AppText } from '@/presentation/components/atoms/app-text';
import {
  PrimaryButton,
  SecondaryButton,
} from '@/presentation/components/atoms/button';
import { ProgressStepBar } from '@/presentation/components/atoms/progress-step-bar';
import { ScreenContainer } from '@/presentation/components/atoms/screen-container';
import { colors, radius, spacing } from '@/presentation/theme';

/**
 * 7. ELEGIR CLUB INICIAL (wireframe #7) — onboarding paso 4 de 4.
 * Sprint 2 real: las ofertas se generan desde `clubRepository.findByPais`
 * (clubes del país elegido, sembrados en el arranque). Al confirmar se crea
 * el `player` real en SQLite + temporada + historial, y se navega al dashboard.
 */
export default function ClubScreen() {
  const { pais, nombre, numero, pierna, posicion, limpiar } = useOnboardingStore();
  const setPlayer = usePlayerStore((s) => s.setPlayer);
  const setTemporadaActiva = usePlayerStore((s) => s.setTemporadaActiva);

  const [ofertas, setOfertas] = useState<Club[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [elegido, setElegido] = useState<number | null>(null);
  const [creando, setCreando] = useState(false);

  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        const clubes = pais ? await clubRepository.findByPais(pais) : [];
        if (activo) {
          setOfertas(clubes);
          setCargando(false);
        }
      } catch (e) {
        if (activo) {
          setError(e instanceof Error ? e.message : 'No se pudieron cargar las ofertas');
          setCargando(false);
        }
      }
    })();
    return () => {
      activo = false;
    };
  }, [pais]);

  const confirmar = async () => {
    if (elegido == null || !posicion || !pais) return;
    setCreando(true);
    try {
      const { player, temporada } = await iniciarCarrera({
        player: {
          nombre,
          numero,
          pais,
          posicion,
          pierna,
          edad: CAREER_START_AGE,
          ovr: OVR_START,
        },
        clubId: elegido,
        modo: 'normal',
        anioInicio: new Date().getFullYear(),
      });
      setPlayer(player);
      setTemporadaActiva(temporada);
      limpiar();
      router.replace('/(main)');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo iniciar la carrera');
      setCreando(false);
    }
  };

  return (
    <ScreenContainer
      footer={
        <>
          <SecondaryButton label="Volver" onPress={() => router.back()} />
          <PrimaryButton
            label="Confirmar club"
            disabled={elegido == null || creando}
            onPress={confirmar}
          />
        </>
      }>
      <View style={styles.content}>
        <ProgressStepBar current={4} total={4} />
        <AppText variant="title" uppercase>
          Tu primer club
        </AppText>
        <AppText variant="caption" style={styles.subtitle}>
          Paso 4 de 4 · Recibiste ofertas de {pais}. Elige tu destino.
        </AppText>

        {cargando && (
          <View style={styles.centro}>
            <ActivityIndicator color={colors.textPrimary} />
          </View>
        )}

        {!cargando && error && (
          <View style={styles.centro}>
            <AppText variant="body" color="danger">
              {error}
            </AppText>
          </View>
        )}

        {!cargando && !error && (
          <View style={styles.ofertas}>
            {ofertas.map((club) => {
              const isSelected = elegido === club.id;
              return (
                <Pressable
                  key={club.id}
                  onPress={() => setElegido(club.id)}
                  style={({ pressed }) => [
                    styles.clubCard,
                    isSelected && styles.clubCardSelected,
                    pressed && styles.pressed,
                  ]}>
                  <View style={[styles.shield, isSelected && styles.shieldSelected]}>
                    <Ionicons
                      name="shield"
                      size={28}
                      color={isSelected ? colors.onAccent : colors.textSecondary}
                    />
                  </View>
                  <View style={styles.clubInfo}>
                    <AppText variant="heading" color={isSelected ? 'textPrimary' : 'textSecondary'}>
                      {club.nombre}
                    </AppText>
                    <AppText variant="caption">{club.liga}</AppText>
                  </View>
                  <View style={styles.stars}>
                    {Array.from({ length: 5 }, (_, i) => (
                      <Ionicons
                        key={i}
                        name={i < club.prestigio ? 'star' : 'star-outline'}
                        size={14}
                        color={i < club.prestigio ? colors.warning : colors.textMuted}
                      />
                    ))}
                  </View>
                </Pressable>
              );
            })}

            {ofertas.length === 0 && (
              <AppText variant="body" color="textSecondary" style={styles.sinOfertas}>
                No hay clubes disponibles en {pais}. Intenta volver a seleccionar tu país.
              </AppText>
            )}
          </View>
        )}

        <View style={styles.nota}>
          <AppText variant="caption" color="textMuted">
            Empezás con {CAREER_START_AGE} años y OVR {OVR_START}. Cada temporada
            simulada y cada decisión definen tu legado: títulos, goles y el club
            al que llegues.
          </AppText>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingTop: spacing.lg,
  },
  subtitle: {
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  ofertas: {
    gap: spacing.md,
  },
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  sinOfertas: {
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  clubCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  clubCardSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.surfaceRaised,
  },
  shield: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shieldSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  clubInfo: {
    flex: 1,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  pressed: { opacity: 0.7 },
  nota: {
    marginTop: spacing.lg,
  },
});