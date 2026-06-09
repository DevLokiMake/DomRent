import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';

interface PropertyMapProps {
  latitude: number;
  longitude: number;
  title: string;
  city?: string;
}

export default function PropertyMap({ latitude, longitude, title, city }: PropertyMapProps) {
  const delta = 0.01;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>📍 Расположение</Text>
      <MapView
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        initialRegion={{
          latitude,
          longitude,
          latitudeDelta: delta,
          longitudeDelta: delta,
        }}
        scrollEnabled={false}
        zoomEnabled={false}
        pitchEnabled={false}
        rotateEnabled={false}
      >
        <Marker
          coordinate={{ latitude, longitude }}
          title={title}
          description={city}
        />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 10,
  },
  map: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
  },
});
