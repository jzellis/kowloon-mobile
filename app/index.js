// Root screen — placeholder. The real app will start with an account-picker
// (or first-launch onboarding) before this lands.

import { StyleSheet, Text, View } from 'react-native';

export default function Home() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Kowloon</Text>
      <Text style={styles.subtitle}>Mobile · scaffold</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAF4E8',
  },
  title: {
    fontSize: 48,
    fontWeight: '700',
    letterSpacing: 2,
    color: '#1A2B4A',
  },
  subtitle: {
    fontSize: 12,
    letterSpacing: 4,
    textTransform: 'uppercase',
    color: '#6B5D4E',
    marginTop: 8,
  },
});
