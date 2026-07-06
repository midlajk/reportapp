import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  ScrollView,
  Linking,
} from 'react-native';
import { Text, TextInput, Button, Surface } from 'react-native-paper';
import { initSupabase, checkConnection } from '../utils/supabase';

interface Props {
  onConnected: () => void;
}

const SetupScreen: React.FC<Props> = ({ onConnected }) => {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConnect = async () => {
    if (!url.trim() || !anonKey.trim()) {
      setError('Both Project URL and Anon Key are required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await initSupabase(url, anonKey);
      const result = await checkConnection();
      if (result.ok) {
        onConnected();
      } else {
        setError(`Connection failed: ${result.error || 'Unable to reach database. Check your credentials.'}`);
      }
    } catch (e: any) {
      setError(`Error: ${e.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.wrapper}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>KH</Text>
          </View>
          <Text style={styles.brandTitle}>Keloth Huller</Text>
          <Text style={styles.brandSubtitle}>Coffee Business Management</Text>
        </View>

        {/* Card */}
        <Surface style={styles.card} elevation={3}>
          <Text style={styles.cardTitle}>Database Setup</Text>
          <Text style={styles.cardDescription}>
            Enter your Supabase project credentials to connect the app to your database.
          </Text>

          <TextInput
            mode="outlined"
            label="Supabase Project URL"
            value={url}
            onChangeText={setUrl}
            placeholder="https://xxxx.supabase.co"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
            outlineStyle={styles.inputOutline}
            left={<TextInput.Icon icon="database" />}
          />

          <TextInput
            mode="outlined"
            label="Supabase Anon/Public Key"
            value={anonKey}
            onChangeText={setAnonKey}
            placeholder="eyJhbGciOiJIUzI1NiIsInR5..."
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
            style={styles.input}
            outlineStyle={styles.inputOutline}
            left={<TextInput.Icon icon="key" />}
          />

          {!!error && (
            <Surface style={styles.errorBox} elevation={0}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </Surface>
          )}

          <Button
            mode="contained"
            onPress={handleConnect}
            loading={loading}
            disabled={loading}
            style={styles.connectButton}
            contentStyle={{ height: 54 }}
            labelStyle={{ fontSize: 16, fontWeight: 'bold' }}
            icon="cloud-check"
          >
            {loading ? 'Connecting...' : 'Connect to Database'}
          </Button>
        </Surface>

        {/* Guide */}
        <Surface style={styles.guideCard} elevation={1}>
          <Text style={styles.guideTitle}>Where to find these?</Text>
          <Text style={styles.guideStep}>1. Go to supabase.com → your project</Text>
          <Text style={styles.guideStep}>2. Click Settings → API</Text>
          <Text style={styles.guideStep}>3. Copy Project URL and anon/public key</Text>
          <Button
            mode="text"
            onPress={() => Linking.openURL('https://supabase.com/dashboard')}
            labelStyle={{ fontSize: 13, color: '#4A90E2' }}
            icon="open-in-new"
          >
            Open Supabase Dashboard
          </Button>
        </Surface>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#F0F4F8',
  },
  container: {
    padding: 24,
    paddingTop: 60,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2c3e50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  brandSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    letterSpacing: 0.5,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 20,
    lineHeight: 20,
  },
  input: {
    backgroundColor: '#FAFAFA',
    marginBottom: 14,
  },
  inputOutline: {
    borderRadius: 10,
  },
  errorBox: {
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  errorText: {
    color: '#C62828',
    fontSize: 13,
    lineHeight: 18,
  },
  connectButton: {
    borderRadius: 12,
    marginTop: 4,
    backgroundColor: '#2c3e50',
  },
  guideCard: {
    width: '100%',
    backgroundColor: '#EBF5FB',
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: '#D6EAF8',
  },
  guideTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1A5276',
    marginBottom: 10,
  },
  guideStep: {
    fontSize: 13,
    color: '#2E86C1',
    marginBottom: 6,
    lineHeight: 18,
  },
});

export default SetupScreen;
