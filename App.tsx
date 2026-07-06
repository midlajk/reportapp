import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider as PaperProvider, MD3LightTheme as DefaultTheme, ActivityIndicator } from 'react-native-paper';
import { View } from 'react-native';

import HomeScreen from './src/screens/HomeScreen';
import ReportFormScreen from './src/screens/ReportFormScreen';
import SetupScreen from './src/screens/SetupScreen';
import { loadSupabase, checkConnection } from './src/utils/supabase';

import { useFonts } from 'expo-font';

export type RootStackParamList = {
  Home: undefined;
  ReportForm: { type: 'Arrival' | 'Dispatch' };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#2c3e50',
    secondary: '#F5A623',
    background: '#F0F4F8',
    surface: '#FFFFFF',
  },
};

export default function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [checking, setChecking] = useState(true);

  const [fontsLoaded] = useFonts({
    'Material Design Icons': require('./node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialCommunityIcons.ttf'),
  });

  useEffect(() => {
    (async () => {
      const hasCredentials = await loadSupabase();
      if (hasCredentials) {
        const result = await checkConnection();
        setIsConnected(result.ok);
      }
      setChecking(false);
    })();
  }, []);

  if (checking || !fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F4F8' }}>
        <ActivityIndicator size="large" color="#2c3e50" />
      </View>
    );
  }

  if (!isConnected) {
    return (
      <PaperProvider theme={theme}>
        <SetupScreen onConnected={() => setIsConnected(true)} />
      </PaperProvider>
    );
  }

  return (
    <PaperProvider theme={theme}>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerStyle: { backgroundColor: '#2c3e50' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: 'bold' },
          }}
        >
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ title: 'Keloth Huller Reports' }}
          />
          <Stack.Screen
            name="ReportForm"
            component={ReportFormScreen}
            options={({ route }) => ({ title: `${route.params.type} Report` })}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}
