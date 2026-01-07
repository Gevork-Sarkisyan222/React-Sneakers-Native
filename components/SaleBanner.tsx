import React from 'react';
import { View, Text, StyleSheet, ImageBackground, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';

const { width } = Dimensions.get('window');

interface SaleBannerProps {
  title: string;
  subtitle?: string;
  iconName: string;
  backgroundColor: string;
  imageSource: any; // require or { uri: ... }
}

export default function SaleBanner({
  title,
  subtitle,
  iconName,
  backgroundColor,
  imageSource,
}: SaleBannerProps) {
  // Assumes backgroundColor is passed as a HEX color (#RRGGBB)
  // Add transparency for the overlay. If the color is not in HEX format, a default transparent color can be used.
  const overlayColor = backgroundColor.length === 7 ? backgroundColor + '90' : 'rgba(0,0,0,0.5)';

  return (
    <View style={styles.wrapper}>
      <ImageBackground
        source={imageSource}
        style={styles.imageBackground}
        imageStyle={styles.imageStyle}>
        <View style={[styles.overlay, { backgroundColor: overlayColor }]}>
          <Icon name={iconName} size={28} color="#fff" style={styles.icon} />
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: width - 32,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    marginVertical: 12,
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    // Shadow for Android
    elevation: 6,
  },
  imageBackground: {
    width: '100%',
    height: 180,
    justifyContent: 'flex-end',
  },
  imageStyle: {
    resizeMode: 'cover',
  },
  overlay: {
    padding: 20,
  },
  icon: {
    marginBottom: 10,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    color: '#eaeaea',
    fontSize: 16,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
});
