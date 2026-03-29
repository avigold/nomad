import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CountryRule } from '../src/db/types';

const { mockAdd, mockUpdate, mockDelete } = vi.hoisted(() => ({
  mockAdd: vi.fn(),
  mockUpdate: vi.fn(),
  mockDelete: vi.fn(),
}));

vi.mock('../src/db/database', () => ({
  db: {
    rules: {
      add: mockAdd,
      update: mockUpdate,
      delete: mockDelete,
    },
  },
}));

import { addRule, updateRule, deleteRule } from '../src/db/ruleOperations';

const sampleRule: CountryRule = {
  country: 'US',
  name: 'United States',
  threshold: 90,
  window: 180,
};

describe('addRule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls db.rules.add with the provided rule', async () => {
    mockAdd.mockResolvedValueOnce(undefined);

    await addRule(sampleRule);

    expect(mockAdd).toHaveBeenCalledOnce();
    expect(mockAdd).toHaveBeenCalledWith(sampleRule);
  });

  it('returns void on success', async () => {
    mockAdd.mockResolvedValueOnce('US');

    const result = await addRule(sampleRule);

    expect(result).toBeUndefined();
  });

  it('propagates errors thrown by db.rules.add', async () => {
    const error = new Error('Constraint error: duplicate key');
    mockAdd.mockRejectedValueOnce(error);

    await expect(addRule(sampleRule)).rejects.toThrow('Constraint error: duplicate key');
  });

  it('calls db.rules.add with a rule containing only required fields', async () => {
    mockAdd.mockResolvedValueOnce(undefined);
    const minimalRule: CountryRule = { country: 'DE', name: 'Germany', threshold: 90, window: 180 };

    await addRule(minimalRule);

    expect(mockAdd).toHaveBeenCalledWith(minimalRule);
  });

  it('calls db.rules.add with a rule where country is an empty string', async () => {
    mockAdd.mockResolvedValueOnce(undefined);
    const ruleWithEmptyCountry: CountryRule = { country: '', name: '', threshold: 30, window: 90 };

    await addRule(ruleWithEmptyCountry);

    expect(mockAdd).toHaveBeenCalledWith(ruleWithEmptyCountry);
  });

  it('calls db.rules.add with a rule where threshold is zero', async () => {
    mockAdd.mockResolvedValueOnce(undefined);
    const ruleWithZeroDays: CountryRule = { country: 'FR', name: 'France', threshold: 0, window: 180 };

    await addRule(ruleWithZeroDays);

    expect(mockAdd).toHaveBeenCalledWith(ruleWithZeroDays);
  });

  it('calls db.rules.add exactly once per invocation', async () => {
    mockAdd.mockResolvedValue(undefined);

    await addRule(sampleRule);
    await addRule({ ...sampleRule, country: 'GB' });

    expect(mockAdd).toHaveBeenCalledTimes(2);
  });
});

describe('updateRule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls db.rules.update with the country key and changes', async () => {
    mockUpdate.mockResolvedValueOnce(1);

    await updateRule('US', { threshold: 60 });

    expect(mockUpdate).toHaveBeenCalledOnce();
    expect(mockUpdate).toHaveBeenCalledWith('US', { threshold: 60 });
  });

  it('returns void on success', async () => {
    mockUpdate.mockResolvedValueOnce(1);

    const result = await updateRule('US', { threshold: 60 });

    expect(result).toBeUndefined();
  });

  it('calls db.rules.update with multiple changed fields', async () => {
    mockUpdate.mockResolvedValueOnce(1);

    await updateRule('DE', { threshold: 45, window: 90 });

    expect(mockUpdate).toHaveBeenCalledWith('DE', { threshold: 45, window: 90 });
  });

  it('calls db.rules.update with an empty changes object', async () => {
    mockUpdate.mockResolvedValueOnce(0);

    await updateRule('FR', {});

    expect(mockUpdate).toHaveBeenCalledWith('FR', {});
  });

  it('propagates errors thrown by db.rules.update', async () => {
    const error = new Error('Update failed');
    mockUpdate.mockRejectedValueOnce(error);

    await expect(updateRule('US', { threshold: 30 })).rejects.toThrow('Update failed');
  });

  it('calls db.rules.update with an empty string country key', async () => {
    mockUpdate.mockResolvedValueOnce(0);

    await updateRule('', { threshold: 10 });

    expect(mockUpdate).toHaveBeenCalledWith('', { threshold: 10 });
  });

  it('calls db.rules.update with threshold set to zero', async () => {
    mockUpdate.mockResolvedValueOnce(1);

    await updateRule('US', { threshold: 0 });

    expect(mockUpdate).toHaveBeenCalledWith('US', { threshold: 0 });
  });

  it('does not pass the country field in the changes object', async () => {
    mockUpdate.mockResolvedValueOnce(1);
    const changes = { threshold: 90 };

    await updateRule('US', changes);

    const passedChanges = mockUpdate.mock.calls[0][1];
    expect(passedChanges).not.toHaveProperty('country');
  });

  it('calls db.rules.update exactly once per invocation', async () => {
    mockUpdate.mockResolvedValue(1);

    await updateRule('US', { threshold: 30 });
    await updateRule('DE', { window: 365 });

    expect(mockUpdate).toHaveBeenCalledTimes(2);
  });
});

describe('deleteRule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls db.rules.delete with the provided country key', async () => {
    mockDelete.mockResolvedValueOnce(undefined);

    await deleteRule('US');

    expect(mockDelete).toHaveBeenCalledOnce();
    expect(mockDelete).toHaveBeenCalledWith('US');
  });

  it('returns void on success', async () => {
    mockDelete.mockResolvedValueOnce(undefined);

    const result = await deleteRule('US');

    expect(result).toBeUndefined();
  });

  it('propagates errors thrown by db.rules.delete', async () => {
    const error = new Error('Delete failed');
    mockDelete.mockRejectedValueOnce(error);

    await expect(deleteRule('US')).rejects.toThrow('Delete failed');
  });

  it('calls db.rules.delete with an empty string country key', async () => {
    mockDelete.mockResolvedValueOnce(undefined);

    await deleteRule('');

    expect(mockDelete).toHaveBeenCalledWith('');
  });

  it('calls db.rules.delete with a non-existent country key without throwing', async () => {
    mockDelete.mockResolvedValueOnce(undefined);

    await expect(deleteRule('NONEXISTENT')).resolves.toBeUndefined();
    expect(mockDelete).toHaveBeenCalledWith('NONEXISTENT');
  });

  it('calls db.rules.delete exactly once per invocation', async () => {
    mockDelete.mockResolvedValue(undefined);

    await deleteRule('US');
    await deleteRule('DE');

    expect(mockDelete).toHaveBeenCalledTimes(2);
  });

  it('calls db.rules.delete with a country key containing special characters', async () => {
    mockDelete.mockResolvedValueOnce(undefined);

    await deleteRule('country-with-special_chars.123');

    expect(mockDelete).toHaveBeenCalledWith('country-with-special_chars.123');
  });
});

describe('integration: addRule then updateRule then deleteRule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('executes add, update, and delete in sequence without errors', async () => {
    mockAdd.mockResolvedValueOnce(undefined);
    mockUpdate.mockResolvedValueOnce(1);
    mockDelete.mockResolvedValueOnce(undefined);

    await addRule(sampleRule);
    await updateRule('US', { threshold: 60 });
    await deleteRule('US');

    expect(mockAdd).toHaveBeenCalledWith(sampleRule);
    expect(mockUpdate).toHaveBeenCalledWith('US', { threshold: 60 });
    expect(mockDelete).toHaveBeenCalledWith('US');
  });

  it('each operation is independent and uses correct arguments', async () => {
    mockAdd.mockResolvedValue(undefined);
    mockUpdate.mockResolvedValue(1);
    mockDelete.mockResolvedValue(undefined);

    const ruleA: CountryRule = { country: 'FR', name: 'France', threshold: 90, window: 180 };
    const ruleB: CountryRule = { country: 'JP', name: 'Japan', threshold: 90, window: 365 };

    await addRule(ruleA);
    await addRule(ruleB);
    await updateRule('FR', { threshold: 45 });
    await deleteRule('JP');

    expect(mockAdd).toHaveBeenNthCalledWith(1, ruleA);
    expect(mockAdd).toHaveBeenNthCalledWith(2, ruleB);
    expect(mockUpdate).toHaveBeenCalledWith('FR', { threshold: 45 });
    expect(mockDelete).toHaveBeenCalledWith('JP');
  });
});