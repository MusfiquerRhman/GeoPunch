import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import * as Location from 'expo-location';
import * as MediaLibrary from 'expo-media-library';
import { useEffect, useState } from 'react';
import { Button, StyleSheet, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

export default function HomeScreen() {
  const [location, setLocation] = useState<Location.LocationObject | undefined>();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [addrress, setAddrress] = useState<Location.LocationGeocodedAddress[]>([]);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraRef, setCameraRef] = useState<any>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  async function getPosition() {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      // Wrap in try-catch to handle timeouts or disabled hardware
      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      setLocation(location);
    } catch (error) {
      setErrorMsg('Could not fetch location. Is GPS on?');
      console.error('Error fetching location:', error);
      // You should also set an error state here to show a UI message
    }
  }

  const takeSelfie = async () => {
    if (!cameraRef) return;

    try {
      const photo = await cameraRef.takePictureAsync({
        quality: 0.7,
        skipProcessing: true,
      });

      await MediaLibrary.saveToLibraryAsync(photo.uri);

      setPhotoUri(photo.uri);

      setShowCamera(false);
    } catch (err) {
      console.error(err);
      alert('Failed to take photo');
    }
  };

  useEffect(() => {
    getPosition(); // initial call

    const interval = setInterval(() => {
      getPosition();
    }, 5000); // every 5 seconds

    return () => clearInterval(interval); // cleanup
  }, []);

  useEffect(() => {
    const getAddress = async () => {
      if (!location) {
        setErrorMsg('Location not available');
        return;
      }

      const result = await Location.reverseGeocodeAsync({
        latitude: location?.coords.latitude,
        longitude: location?.coords.longitude,
      });

      setAddrress(result);
    };

    getAddress();
  }, [location]);

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/Banner.jpeg')}
          style={styles.reactLogo}
        />
      }>
      <ThemedText type='title'>Attendence</ThemedText>
      {photoUri && (
        <View style={{ marginTop: 20, alignItems: 'center' }}>
          <Image
            source={{ uri: photoUri }}
            style={{ width: '100%', height: 300, borderRadius: 10 }}
          />

        <TouchableOpacity
          onPress={() => {
            setPhotoUri(null);
            setShowCamera(true);
          }}
          style={{
            marginTop: 10,
            width: '100%',
            backgroundColor: '#007AFF',
            paddingVertical: 12,
            borderRadius: 10,
            alignItems: 'center',
          }}
        >
          <ThemedText style={{ color: '#fff', fontWeight: '600' }}>
            Retake Selfie
          </ThemedText>
        </TouchableOpacity>
        </View>
      )}

      {showCamera && (
        <View style={{ flex: 1, height: 400 }}>
          <CameraView
            style={{ flex: 1 }}
            facing="front"
            ref={(ref) => setCameraRef(ref)}
          >
            <View
              style={{
                flex: 1,
                justifyContent: 'flex-end',
                alignItems: 'center',
                marginBottom: 40,
              }}
            >
            </View>
            <Button title="Capture Selfie" onPress={takeSelfie} />
            <Button title="Cancel" onPress={() => setShowCamera(false)} />
          </CameraView>
        </View>
      )}

      {!showCamera && !photoUri && (
        <Button
          title="Take Selfie"
          onPress={async () => {
            if (!permission?.granted) {
              const res = await requestPermission();
              if (!res.granted) {
                alert('Camera permission required');
                return;
              }
            }
            setShowCamera(true);
          }}
        />
      )}
      <View style={styles.container}>
        {location && location.coords.latitude && location.coords.longitude ? (
          <MapView
            style={styles.map}
            provider={PROVIDER_GOOGLE} // Uncomment if you want to use Google Maps on iOS
            initialRegion={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >
            <Marker
              coordinate={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              }}
              title="You are here"
              description="Your current location"
            />
          </MapView>
        ) : (
          <View style={styles.loading}>
            <ThemedText>{errorMsg || 'Fetching location...'}</ThemedText>
          </View>
        )}
      </View>
      <View>
        <ThemedText>Your Approximate Location: {addrress.map((addr) => `${addr.name}, ${addr.city}, ${addr.country}`).join('\n')}</ThemedText>
      </View>

    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: '83%',
    width: '100%',
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  container: {
    flex: 1,
    height: 300,
    marginVertical: 16,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
