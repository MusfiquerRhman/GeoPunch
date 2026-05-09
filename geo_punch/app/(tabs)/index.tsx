import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import * as Location from 'expo-location';
import * as MediaLibrary from 'expo-media-library';
import { useEffect, useState } from 'react';
import { Button, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { API_URL } from '@/constants/API_URL';
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from '@/context/AuthContext';

import { homeStyles } from '@/styles/home';

export default function HomeScreen() {
  const queryClient = useQueryClient();

  const [location, setLocation] = useState<Location.LocationObject | undefined>();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [addrress, setAddrress] = useState<Location.LocationGeocodedAddress[]>([]);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraRef, setCameraRef] = useState<any>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [offices, setOffices] = useState<Array<{id: string; name: string; address: string; latitude: number; longitude: number}>>([]);
  const [nearestLocation, setnearestLocation] = useState({
    office_name: "",
    office_address: "",
    distance: 0,
    office_location_id: 0,
  })
  
  const submitAttendance = async () => {
    const token = await SecureStore.getItemAsync("token");

    const formData = new FormData();

    if(location?.coords.latitude === undefined || location?.coords.longitude === undefined) {
      alert("Location not available. Please ensure GPS is on and try again.");
      return;
    }

    if (!photoUri) {
      alert("Please take a selfie before submitting attendance.");
      return;
    }

    formData.append("photo", {
      uri: photoUri,
      name: "selfie.jpg",
      type: "image/jpeg",
    } as any);

    formData.append("latitude", String(location?.coords.latitude ?? ""));
    formData.append("longitude", String(location?.coords.longitude ?? ""));
    formData.append("address", addrress.map((addr) => `${addr.name}, ${addr.city}, ${addr.country}`).join('\n'));
    formData.append("office_location_id", String(nearestLocation.office_location_id));
    formData.append("distance", String(nearestLocation.distance));

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
        console.error("Failed to record attendance:", res);
        alert("Failed to record attendance");
      }
    }).catch(err => {
      console.error("Error submitting attendance:", err);
      alert("An error occurred while submitting attendance");
    });
  }

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, []);

  useEffect(() => {
    if (showCamera) {
      requestPermission();
    }
  }, [showCamera]);

  useEffect(() => {
    const fetchOffices = async () => {
      try {
        const token = await SecureStore.getItemAsync("token");

        const res = await fetch(`${API_URL}/geo_punch/get_offices`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const json = await res.json();

        console.log("Offices:", json);

        setOffices(json.offices || []);
      } catch (err) {
        console.error("Error fetching offices:", err);
      }
    };

    fetchOffices();
  }, []);

  async function getPosition() {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLocation(currentLocation);
    } catch (error) {
      setErrorMsg('Could not fetch location. Is GPS on?');
      console.error('Error fetching location:', error);
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

    const { logout } = useAuth();

    const fetchNearestOffice = async (
      latitude: number,
      longitude: number
    ) => {
      const token = await SecureStore.getItemAsync("token");

      const res = await fetch(`${API_URL}/geo_punch/get_distance`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          latitude,
          longitude,
        }),
      });

      const json = await res.json();

      if (!json.success) {
        throw new Error(json.message || "Failed to fetch");
      }

      if (res.status === 401) {
        await logout();
        throw new Error("Unauthorized");
      }

      setnearestLocation(json.nearest_office);

      return json.nearest_office;
    };


    useEffect(() => {
      getPosition();

      const interval = setInterval(() => {
        getPosition();
      }, 15000);

      return () => clearInterval(interval);
    }, []);

    useEffect(() => {
      if (!location?.coords) return;

      fetchNearestOffice(
        location.coords.latitude,
        location.coords.longitude
      );
  }, [location]);

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
          style={homeStyles.reactLogo}
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
              <View style={homeStyles.camera_container}>
                <TouchableOpacity style={homeStyles.camera_button} onPress={() => setShowCamera(false)}>
                  <Ionicons name="close" size={20} color="#000" />
                </TouchableOpacity>
              </View>
              <View style={homeStyles.camera_container}>
                <TouchableOpacity style={homeStyles.camera_button} onPress={takeSelfie}>
                  <Ionicons name="camera" size={20} color="#000" />
                </TouchableOpacity>
              </View>
            </View>
          </CameraView>
        </View>
      )}

      {!showCamera && !photoUri && (
        <TouchableOpacity
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
          style={{
            marginTop: 10,
            width: '100%',
            backgroundColor: '#007A74',
            paddingVertical: 12,
            borderRadius: 10,
            alignItems: 'center',
          }}
        >
          <ThemedText style={{ color: '#fff', fontWeight: '600' }}>
            Take Selfie
          </ThemedText>
        </TouchableOpacity>
      )}


      <View style={homeStyles.container}>
        {location && location.coords.latitude && location.coords.longitude ? (
          <MapView
            style={homeStyles.map}
            provider={PROVIDER_GOOGLE} // Uncomment if you want to use Google Maps on iOS
            initialRegion={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >
            {/* User marker */}
          <Marker
            coordinate={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }}
            title="You are here"
            description="Your current location"
            pinColor="red"
          />

          {/* Office markers */}
          {offices.map((office) => (
            <Marker
              key={office.id}
              coordinate={{
                latitude: office.latitude,
                longitude: office.longitude,
              }}
              title={office.name}
              description={office.address}
              pinColor="blue"
            />
          ))}
          </MapView>
        ) : (
          <View style={homeStyles.loading}>
            <ThemedText>{errorMsg || 'Fetching location...'}</ThemedText>
          </View>
        )}
      </View>

      <View>
        <ThemedText>Approximate Location: {addrress.map((addr) => `${addr.name}, ${addr.city}, ${addr.country}`).join('\n')}</ThemedText>
      </View>

      {!!nearestLocation && 
        <View style={homeStyles.cardContainer}>
          <Text style={homeStyles.cardLabel}>Nearest Office</Text>

          <Text style={homeStyles.officeName}>
            {nearestLocation.office_name}
          </Text>

          <View style={homeStyles.addressBox}>
            <Text style={homeStyles.addressLabel}>Address</Text>

            <Text style={homeStyles.addressText}>
              {nearestLocation.office_address}
            </Text>
          </View>

          <View style={homeStyles.bottomRow}>
            <View style={homeStyles.distanceBadge}>
              <Text style={homeStyles.distanceText}>
                {(nearestLocation.distance / 1000).toFixed(2)} km away
              </Text>
            </View>

            <View style={homeStyles.nearbyBadge}>
              <Text style={homeStyles.nearbyText}>Nearby</Text>
            </View>
          </View>
        </View>
      }



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

