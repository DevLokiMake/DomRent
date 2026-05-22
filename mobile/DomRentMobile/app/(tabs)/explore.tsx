import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Heart } from 'lucide-react-native';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';

export default function FavoritesScreen() {
  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Heart size={32} color="#ff3b30" fill="#ff3b30" />
        <ThemedText type="title" style={styles.title}>
          Избранное
        </ThemedText>
      </View>

      {/* Empty State */}
      <View style={styles.emptyContainer}>
        <Heart size={64} color="#ccc" strokeWidth={1} />
        <ThemedText style={styles.emptyTitle}>Нет избранных объектов</ThemedText>
        <ThemedText style={styles.emptyDescription}>
          Добавляйте понравившиеся объекты в избранное, чтобы быстро к ним возвращаться
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
});

