import React from 'react';
import { StyleSheet, View, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';

const { width: screenWidth } = Dimensions.get('window');

export interface PropertyImageCarouselProps {
  images: string[];
  currentIndex: number;
  onPrevImage: () => void;
  onNextImage: () => void;
  onDotPress: (index: number) => void;
}

export function PropertyImageCarousel({
  images,
  currentIndex,
  onPrevImage,
  onNextImage,
  onDotPress,
}: PropertyImageCarouselProps) {
  const hasMultipleImages = images && images.length > 1;

  return (
    <View style={styles.galleryContainer}>
      {images && images.length > 0 ? (
        <>
          <Image
            source={{ uri: images[currentIndex] }}
            style={styles.mainImage}
          />

          {/* Кнопки навигации */}
          {hasMultipleImages && (
            <>
              <TouchableOpacity
                style={[styles.navButton, styles.navButtonLeft]}
                onPress={onPrevImage}>
                <ChevronLeft size={24} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.navButton, styles.navButtonRight]}
                onPress={onNextImage}>
                <ChevronRight size={24} color="#fff" />
              </TouchableOpacity>
            </>
          )}

          {/* Счётчик изображений */}
          {hasMultipleImages && (
            <View style={styles.imageCounter}>
              <ThemedText style={styles.imageCounterText}>
                {currentIndex + 1} / {images.length}
              </ThemedText>
            </View>
          )}

          {/* Точки-индикаторы */}
          {hasMultipleImages && (
            <View style={styles.dotsContainer}>
              {images.map((_, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dot,
                    index === currentIndex && styles.dotActive,
                  ]}
                  onPress={() => onDotPress(index)}
                />
              ))}
            </View>
          )}
        </>
      ) : (
        <View style={[styles.mainImage, styles.noImage]}>
          <ThemedText>Нет изображения</ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  galleryContainer: {
    position: 'relative',
    marginHorizontal: -16,
    marginTop: 12,
    marginBottom: 12,
  },
  mainImage: {
    width: screenWidth,
    height: 280,
    backgroundColor: '#f0f0f0',
  },
  noImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    marginTop: -12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonLeft: {
    left: 12,
  },
  navButtonRight: {
    right: 12,
  },
  imageCounter: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
  },
  imageCounterText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
  },
  dotActive: {
    backgroundColor: '#0a84ff',
    width: 12,
  },
});
