import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import * as Location from 'expo-location';
import * as MediaLibrary from 'expo-media-library';
import { useEffect, useState } from 'react';
import { Button, StyleSheet, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { API_URL } from '@/constants/API_URL';
import { useQueryClient } from "@tanstack/react-query";


export default function HomeScreen() {
  const queryClient = useQueryClient();

  const [location, setLocation] = useState<Location.LocationObject | undefined>();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [addrress, setAddrress] = useState<Location.LocationGeocodedAddress[]>([]);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraRef, setCameraRef] = useState<any>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  
  const submitAttendance = async () => {
    const token = await SecureStore.getItemAsync("token");

    const formData = new FormData();

    formData.append("photo", {
      uri: photoUri,
      name: "selfie.jpg",
      type: "image/jpeg",
    } as any);

    formData.append("latitude", String(location?.coords.latitude ?? ""));
    formData.append("longitude", String(location?.coords.longitude ?? ""));

    await fetch(`${API_URL}/geo_punch/record`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    }).then(res => {
      if (res.ok) {
        alert("Attendance recorded successfully!");
        setPhotoUri(null);
        queryClient.invalidateQueries({ queryKey: ["attendance"] });
      } else {
        alert("Failed to record attendance");
      }
    }).catch(err => {
      console.error("Error submitting attendance:", err);
      alert("An error occurred while submitting attendance");
    });
  }

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
            style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center' }}
            facing="front"
            ref={(ref) => setCameraRef(ref)}
          >
            <View
              style={{
                justifyContent: 'flex-end',
                alignItems: 'center',
                marginBottom: 40,
              }}
            >
            </View>
            <View style={{ 
              position: 'absolute', 
              bottom: 20, 
              right: 20, 
              display: 'flex', 
              flexDirection: 'row', 
              gap: 20,
              width: '90%',
              justifyContent: 'center',
            }}>
              <View style={styles.camera_container}>
                <TouchableOpacity style={styles.camera_button} onPress={() => setShowCamera(false)}>
                  <Ionicons name="close" size={20} color="#000" />
                </TouchableOpacity>
              </View>
              <View style={styles.camera_container}>
                <TouchableOpacity style={styles.camera_button} onPress={takeSelfie}>
                  <Ionicons name="camera" size={20} color="#000" />
                </TouchableOpacity>
              </View>
            </View>
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
        <ThemedText>Approximate Location: {addrress.map((addr) => `${addr.name}, ${addr.city}, ${addr.country}`).join('\n')}</ThemedText>
      </View>
        <TouchableOpacity
          onPress={submitAttendance}
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
            Submit Attendance
          </ThemedText>
        </TouchableOpacity>
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
  camera_container: {
    justifyContent: "center",   // vertical center
    alignItems: "center", 
  },
  camera_button: {
    width: 40,
    height: 40,
    borderRadius: 35,           // perfect circle
    backgroundColor: "#fff",    // white background
    justifyContent: "center",
    alignItems: "center",
      // nice shadow (optional but 🔥)
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
  },
});
