import React from 'react';
import { View, StyleSheet, Image, Dimensions } from 'react-native';
import { Text, Card, TouchableRipple, useTheme } from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Truck, PackagePlus } from 'lucide-react-native';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

const { width } = Dimensions.get('window');

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text variant="headlineMedium" style={styles.title}>Welcome Back!</Text>
        <Text variant="bodyLarge" style={styles.subtitle}>Select an action to continue</Text>
      </View>

      <View style={styles.cardsContainer}>
        <TouchableRipple
          onPress={() => navigation.navigate('ReportForm', { type: 'Arrival' })}
          style={styles.cardRipple}
        >
          <Card style={[styles.card, { borderLeftColor: '#4CAF50', borderLeftWidth: 5 }]}>
            <Card.Content style={styles.cardContent}>
              <View style={[styles.iconContainer, { backgroundColor: '#E8F5E9' }]}>
                <PackagePlus color="#4CAF50" size={32} />
              </View>
              <View style={styles.textContainer}>
                <Text variant="titleLarge" style={styles.cardTitle}>Arrival Report</Text>
                <Text variant="bodyMedium" style={styles.cardSubtitle}>Record incoming goods</Text>
              </View>
            </Card.Content>
          </Card>
        </TouchableRipple>

        <TouchableRipple
          onPress={() => navigation.navigate('ReportForm', { type: 'Dispatch' })}
          style={styles.cardRipple}
        >
          <Card style={[styles.card, { borderLeftColor: '#FF9800', borderLeftWidth: 5 }]}>
            <Card.Content style={styles.cardContent}>
              <View style={[styles.iconContainer, { backgroundColor: '#FFF3E0' }]}>
                <Truck color="#FF9800" size={32} />
              </View>
              <View style={styles.textContainer}>
                <Text variant="titleLarge" style={styles.cardTitle}>Dispatch Report</Text>
                <Text variant="bodyMedium" style={styles.cardSubtitle}>Record outgoing deliveries</Text>
              </View>
            </Card.Content>
          </Card>
        </TouchableRipple>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 20,
  },
  headerContainer: {
    marginVertical: 30,
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  subtitle: {
    color: '#7f8c8d',
  },
  cardsContainer: {
    flex: 1,
  },
  cardRipple: {
    marginBottom: 20,
    borderRadius: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    elevation: 4,
    borderRadius: 12,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  iconContainer: {
    padding: 15,
    borderRadius: 12,
    marginRight: 20,
  },
  textContainer: {
    flex: 1,
  },
  cardTitle: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  cardSubtitle: {
    color: '#666',
  }
});

export default HomeScreen;
