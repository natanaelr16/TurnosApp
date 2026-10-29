import { useState } from 'react';
import { Alert, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button, Card } from '@/components/ui';
import { changePassword, createProtection, resetWithRecovery, verifyPassword } from '@/domain/backup-crypto';
import { useAppData } from '@/hooks/use-app-data';
import { useTheme } from '@/hooks/use-theme';

type Mode = 'none' | 'activate' | 'change' | 'recover';

/** Tarjeta de Ajustes para activar/gestionar la protección con contraseña del respaldo (D-038). */
export function BackupSecurityCard({ disabled }: { disabled?: boolean }) {
  const theme = useTheme();
  const { data, updateSettings } = useAppData();
  const protection = data.settings.backupProtection;
  const [mode, setMode] = useState<Mode>('none');
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);

  const now = () => new Date().toISOString();
  const resetFields = (m: Mode) => { setMode(m); setCurrent(''); setNext(''); setConfirm(''); };

  const input = (label: string, value: string, onChange: (v: string) => void, placeholder?: string) => (
    <View style={styles.field} key={label}>
      <ThemedText type="smallBold">{label}</ThemedText>
      <TextInput
        accessibilityLabel={label} value={value} onChangeText={onChange} placeholder={placeholder}
        placeholderTextColor={theme.textSecondary} secureTextEntry autoCapitalize="none" autoCorrect={false}
        editable={!busy && !disabled}
        style={[styles.input, { color: theme.text, borderColor: theme.textSecondary, backgroundColor: theme.backgroundElement }]} />
    </View>
  );

  const activate = async () => {
    if (next.length < 6) { Alert.alert('Contraseña muy corta', 'Usa al menos 6 caracteres.'); return; }
    if (next !== confirm) { Alert.alert('No coinciden', 'La contraseña y su confirmación deben ser iguales.'); return; }
    setBusy(true);
    try {
      const { protection: p, recoveryCode } = createProtection(next, now());
      await updateSettings({ backupProtection: p });
      resetFields('none');
      Alert.alert('Protección activada',
        `Anota este código de recuperación en un lugar seguro (lo necesitas si olvidas la contraseña):\n\n${recoveryCode}\n\nSin él y sin la contraseña, los respaldos cifrados no se pueden abrir.`,
        [{ text: 'Ya lo anoté' }]);
    } catch { Alert.alert('No se pudo activar', 'Intenta de nuevo.'); }
    finally { setBusy(false); }
  };

  const change = async () => {
    if (!protection) return;
    if (!verifyPassword(protection, current)) { Alert.alert('Contraseña incorrecta', 'Esa no es la contraseña actual.'); return; }
    if (next.length < 6 || next !== confirm) { Alert.alert('Revisa la nueva', 'Mínimo 6 caracteres y la confirmación debe coincidir.'); return; }
    setBusy(true);
    try {
      await updateSettings({ backupProtection: changePassword(protection, next, now()) });
      resetFields('none');
      Alert.alert('Contraseña actualizada', 'Los próximos respaldos usarán la nueva contraseña. Los PDF anteriores se abren con la contraseña con la que se crearon.');
    } catch { Alert.alert('No se pudo cambiar', 'Intenta de nuevo.'); }
    finally { setBusy(false); }
  };

  const recover = async () => {
    if (!protection) return;
    const p = resetWithRecovery(protection, current, next, now());
    if (!p) { Alert.alert('Código incorrecto', 'Ese código de recuperación no abre esta protección.'); return; }
    if (next.length < 6 || next !== confirm) { Alert.alert('Revisa la nueva', 'Mínimo 6 caracteres y la confirmación debe coincidir.'); return; }
    setBusy(true);
    try {
      await updateSettings({ backupProtection: p });
      resetFields('none');
      Alert.alert('Contraseña restablecida', 'Ya puedes usar tu nueva contraseña. El código de recuperación no cambió.');
    } catch { Alert.alert('No se pudo restablecer', 'Intenta de nuevo.'); }
    finally { setBusy(false); }
  };

  const deactivate = () =>
    Alert.alert('Quitar protección',
      'Los respaldos nuevos saldrán SIN cifrar. Los PDF cifrados anteriores solo se abrirán escribiendo la contraseña (o código) con la que fueron creados.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Quitar protección', style: 'destructive', onPress: async () => {
        setBusy(true);
        try { await updateSettings({ backupProtection: undefined }); resetFields('none'); }
        catch { Alert.alert('No se pudo quitar', 'Intenta de nuevo.'); }
        finally { setBusy(false); }
      } },
    ]);

  return (
    <Card title="Seguridad del respaldo">
      {protection
        ? <ThemedText type="caption" themeColor="textSecondary">Protección ACTIVA: los PDF de respaldo se cifran y solo se abren con tu contraseña o código de recuperación.</ThemedText>
        : <ThemedText type="caption" themeColor="textSecondary">Opcional: cifra tus respaldos con una contraseña. Sin ella, el PDF sale con los datos legibles. Al activarla se genera un código de recuperación que debes anotar.</ThemedText>}

      {mode === 'none' && !protection ? <Button label="Activar contraseña para respaldos" variant="secondary" disabled={disabled || busy} onPress={() => resetFields('activate')} /> : null}
      {mode === 'none' && protection ? <>
        <Button label="Cambiar contraseña" variant="secondary" disabled={disabled || busy} onPress={() => resetFields('change')} />
        <Button label="Olvidé mi contraseña (usar código)" variant="secondary" disabled={disabled || busy} onPress={() => resetFields('recover')} />
        <Button label="Quitar protección" variant="secondary" disabled={disabled || busy} onPress={deactivate} />
      </> : null}

      {mode === 'activate' ? <>
        {input('Contraseña nueva', next, setNext, 'Mínimo 6 caracteres')}
        {input('Confirmar contraseña', confirm, setConfirm)}
        <Button label={busy ? 'Activando…' : 'Activar protección'} disabled={busy || disabled} onPress={activate} />
        <Button label="Cancelar" variant="secondary" disabled={busy} onPress={() => resetFields('none')} />
      </> : null}
      {mode === 'change' ? <>
        {input('Contraseña actual', current, setCurrent)}
        {input('Contraseña nueva', next, setNext, 'Mínimo 6 caracteres')}
        {input('Confirmar contraseña', confirm, setConfirm)}
        <Button label={busy ? 'Cambiando…' : 'Guardar nueva contraseña'} disabled={busy || disabled} onPress={change} />
        <Button label="Cancelar" variant="secondary" disabled={busy} onPress={() => resetFields('none')} />
      </> : null}
      {mode === 'recover' ? <>
        {input('Código de recuperación', current, setCurrent, 'XXXX-XXXX-XXXX')}
        {input('Contraseña nueva', next, setNext, 'Mínimo 6 caracteres')}
        {input('Confirmar contraseña', confirm, setConfirm)}
        <Button label={busy ? 'Restableciendo…' : 'Restablecer contraseña'} disabled={busy || disabled} onPress={recover} />
        <Button label="Cancelar" variant="secondary" disabled={busy} onPress={() => resetFields('none')} />
      </> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  field: { gap: 8 },
  input: { minHeight: 48, borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 18 },
});
