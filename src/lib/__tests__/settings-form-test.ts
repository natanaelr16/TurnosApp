import { DEFAULT_SETTINGS } from '@/domain/defaults';
import { draftFromSettings, settingsFromDraft, validateSettingsDraft } from '../settings-form';

const date = '2026-10-25';
const valid = () => draftFromSettings({ ...DEFAULT_SETTINGS, baseSalary: 3_000_000 }, date);

test('mantiene valores legales dinámicos como opcionales', () => {
  const draft = valid();
  expect(draft.divisor).toBe('');
  expect(settingsFromDraft(draft, DEFAULT_SETTINGS).monthlyDivisor).toBeUndefined();
  expect(settingsFromDraft(draft, DEFAULT_SETTINGS).overrides).toEqual({});
});

test('salario en pesos enteros, límites positivos y porcentajes válidos', () => {
  expect(validateSettingsDraft(valid())).toEqual({});
  for (const salary of ['', '0', '-1', '1.5', 'Infinity', '9007199254740992']) {
    expect(validateSettingsDraft({ ...valid(), salary }).salary).toBeTruthy();
  }
  expect(validateSettingsDraft({ ...valid(), daily: '25' }).daily).toBeTruthy();
  expect(validateSettingsDraft({ ...valid(), weekly: '0' }).weekly).toBeTruthy();
  expect(validateSettingsDraft({ ...valid(), divisor: '0' }).divisor).toBeTruthy();
  expect(validateSettingsDraft({ ...valid(), nightPct: '-1' }).nightPct).toBeTruthy();
  expect(validateSettingsDraft({ ...valid(), nightPct: '35,5' }).nightPct).toBeUndefined();
});

test('auxilio exige elección explícita y monto entero solo si se activa', () => {
  expect(validateSettingsDraft({ ...valid(), allowanceEnabled: null }).allowanceEnabled).toBeTruthy();
  expect(validateSettingsDraft({ ...valid(), allowanceEnabled: true, allowance: '' }).allowance).toBeTruthy();
  expect(validateSettingsDraft({ ...valid(), allowanceEnabled: false, allowance: '' }).allowance).toBeUndefined();
});

test('acepta divisor decimal y auxilio cero sin activarlo automáticamente', () => {
  const draft = { ...valid(), divisor: '210,5', allowanceEnabled: true, allowance: '0' };
  expect(validateSettingsDraft(draft)).toEqual({});
  expect(settingsFromDraft(draft, DEFAULT_SETTINGS).monthlyDivisor).toBe(210.5);
  expect(settingsFromDraft(draft, DEFAULT_SETTINGS).transportAllowance).toEqual({ enabled: true, amount: 0 });
  expect(draftFromSettings({ ...DEFAULT_SETTINGS, baseSalary: 1 }, date).allowanceEnabled).toBe(false);
});

test('no fija un monto legal si el auxilio está desactivado y conserva un monto personalizado', () => {
  expect(settingsFromDraft(valid(), DEFAULT_SETTINGS).transportAllowance).toEqual({ enabled: false });
  expect(draftFromSettings({ ...DEFAULT_SETTINGS, transportAllowance: { enabled: true, amount: 300000 } }, '2027-01-01').allowance).toBe('300000');
});

test('convierte cambios sin perder metadatos ni deducciones', () => {
  const previous = { ...DEFAULT_SETTINGS, onboardingCompletedAt: 'fecha', monthlyDeductions: 100_000 };
  const settings = settingsFromDraft({ ...valid(), allowanceEnabled: true, allowance: '249095', divisor: '210', nightPct: '35,5' }, previous);
  expect(settings).toMatchObject({ baseSalary: 3_000_000, monthlyDivisor: 210, overrides: { nightPct: 35.5 }, transportAllowance: { enabled: true, amount: 249095 }, onboardingCompletedAt: 'fecha', monthlyDeductions: 100000 });
});
