import { fieldsFromDraft, localFromPicker, pickerFromLocal } from '../record-form';

test('selector conserva fecha y hora locales sin toISOString', () => {
  expect(localFromPicker(pickerFromLocal('2026-10-25T18:30'))).toBe('2026-10-25T18:30');
});

test('campos texto, alfanuméricos y números; vacío numérico no se convierte a cero', () => {
  expect(fieldsFromDraft([{ id: '1', name: ' Grúa ', value: 'RTG19', type: 'text' }, { id: '2', name: 'Movimientos', value: '42,5', type: 'number' }])).toEqual([{ name: 'Grúa', value: 'RTG19' }, { name: 'Movimientos', value: 42.5 }]);
  expect(() => fieldsFromDraft([{ id: 'x', name: 'N', value: '', type: 'number' }])).toThrow();
  expect(() => fieldsFromDraft([{ id: 'x', name: 'N', value: 'Infinity', type: 'number' }])).toThrow();
});
