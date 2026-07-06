import 'react-native-url-polyfill/auto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL_KEY = '@supabase_url';
const SUPABASE_ANON_KEY = '@supabase_anon_key';
const MANUAL_SLIP_KEY = '@last_manual_slip';

let _client: SupabaseClient | null = null;

// ─── Client Management ──────────────────────────────────────────────────────

/**
 * Initialize Supabase client with provided credentials and save them locally.
 */
export const initSupabase = async (url: string, anonKey: string): Promise<void> => {
  _client = createClient(url.trim(), anonKey.trim());
  await AsyncStorage.setItem(SUPABASE_URL_KEY, url.trim());
  await AsyncStorage.setItem(SUPABASE_ANON_KEY, anonKey.trim());
};

/**
 * Load saved credentials and create client. Returns true if credentials exist.
 */
export const loadSupabase = async (): Promise<boolean> => {
  try {
    const url = await AsyncStorage.getItem(SUPABASE_URL_KEY);
    const key = await AsyncStorage.getItem(SUPABASE_ANON_KEY);
    if (url && key) {
      _client = createClient(url, key);
      return true;
    }
    return false;
  } catch {
    return false;
  }
};

/**
 * Returns the active Supabase client or throws if not initialised.
 */
export const getClient = (): SupabaseClient => {
  if (!_client) throw new Error('Supabase client not initialised');
  return _client;
};

/**
 * Test the connection by querying products table. Returns true on success.
 */
export const checkConnection = async (): Promise<{ ok: boolean; error?: string }> => {
  try {
    const { error } = await getClient().from('products').select('id').limit(1);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message || 'Unknown error' };
  }
};

/**
 * Clear saved credentials (used if user wants to reset connection).
 */
export const clearCredentials = async (): Promise<void> => {
  _client = null;
  await AsyncStorage.removeItem(SUPABASE_URL_KEY);
  await AsyncStorage.removeItem(SUPABASE_ANON_KEY);
};

// ─── Parties ────────────────────────────────────────────────────────────────

export const getParties = async (): Promise<string[]> => {
  try {
    const { data, error } = await getClient()
      .from('parties')
      .select('name')
      .order('name', { ascending: true });
    if (error) throw error;
    return (data || []).map((p: any) => p.name);
  } catch (e) {
    console.error('getParties error:', e);
    return [];
  }
};

export const saveParty = async (name: string): Promise<void> => {
  const trimmed = name.trim();
  if (!trimmed) return;
  try {
    await getClient()
      .from('parties')
      .upsert({ name: trimmed }, { onConflict: 'name', ignoreDuplicates: true });
  } catch (e) {
    console.error('saveParty error:', e);
  }
};

// ─── Products ────────────────────────────────────────────────────────────────

export const getProducts = async (): Promise<string[]> => {
  try {
    const { data, error } = await getClient()
      .from('products')
      .select('name')
      .order('name', { ascending: true });
    if (error) throw error;
    return (data || []).map((p: any) => p.name);
  } catch (e) {
    console.error('getProducts error:', e);
    return [];
  }
};

export const saveProduct = async (name: string): Promise<void> => {
  const trimmed = name.trim();
  if (!trimmed) return;
  try {
    await getClient()
      .from('products')
      .upsert({ name: trimmed, is_custom: true }, { onConflict: 'name', ignoreDuplicates: true });
  } catch (e) {
    console.error('saveProduct error:', e);
  }
};

// ─── Manual Slip Number ─────────────────────────────────────────────────────

/**
 * Get the next auto-incremented Manual slip number.
 * Checks both the database and local cache, returns max + 1.
 */
export const getNextManualSlipNumber = async (): Promise<string> => {
  try {
    // Try to get last manual slip from database
    const { data } = await getClient()
      .from('transactions')
      .select('weighment_slip_number')
      .eq('weigher', 'Manual')
      .order('serial_number', { ascending: false })
      .limit(1);

    let lastNum = 0;
    if (data && data.length > 0) {
      const parsed = parseInt(data[0].weighment_slip_number, 10);
      if (!isNaN(parsed)) lastNum = parsed;
    }

    // Also check local cache
    const localStr = await AsyncStorage.getItem(MANUAL_SLIP_KEY);
    const localNum = localStr ? parseInt(localStr, 10) : 0;
    const nextNum = Math.max(lastNum, localNum) + 1;

    return nextNum.toString();
  } catch {
    // Fallback to local
    const localStr = await AsyncStorage.getItem(MANUAL_SLIP_KEY);
    const localNum = localStr ? parseInt(localStr, 10) : 0;
    return (localNum + 1).toString();
  }
};

export const saveLastManualSlipNumber = async (num: string): Promise<void> => {
  const parsed = parseInt(num, 10);
  if (!isNaN(parsed)) {
    await AsyncStorage.setItem(MANUAL_SLIP_KEY, parsed.toString());
  }
};

// ─── Transactions ────────────────────────────────────────────────────────────

/**
 * Check if a transaction with given weigher + slipNumber already exists.
 */
export const checkTransactionExists = async (
  weigher: string,
  slipNumber: string
): Promise<{ exists: boolean; record?: any }> => {
  try {
    const { data, error } = await getClient()
      .from('transactions')
      .select('*')
      .eq('weigher', weigher)
      .eq('weighment_slip_number', slipNumber)
      .limit(1);

    if (error) throw error;
    if (data && data.length > 0) {
      return { exists: true, record: data[0] };
    }
    return { exists: false };
  } catch (e) {
    console.error('checkTransactionExists error:', e);
    return { exists: false };
  }
};

/**
 * Save a new transaction record.
 */
export const saveTransaction = async (data: any): Promise<any> => {
  // Auto-save party
  if (data.party_name) await saveParty(data.party_name);

  const { data: result, error } = await getClient()
    .from('transactions')
    .insert(data)
    .select()
    .single();

  if (error) throw error;

  // Update local manual slip cache if needed
  if (data.weigher === 'Manual') {
    await saveLastManualSlipNumber(data.weighment_slip_number);
  }

  return result;
};

/**
 * Update an existing transaction record.
 */
export const updateTransaction = async (id: string, data: any): Promise<any> => {
  // Auto-save party
  if (data.party_name) await saveParty(data.party_name);

  const { data: result, error } = await getClient()
    .from('transactions')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return result;
};
