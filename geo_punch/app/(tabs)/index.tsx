import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";
import { Image } from "expo-image";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { apiRequest } from "@/constants/apiRequest";
import { useAuth } from "@/context/AuthContext";
import { homeStyles } from "@/styles/home";

type Office = {
  id: number | string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
};

type NearestOffice = {
  office_name: string;
  office_address: string;
  distance: number;
  office_location_id: number;
};

const hasGoogleMapsApiKey = Boolean(process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY);

function formatAddress(addresses: Location.LocationGeocodedAddress[]) {
  const address = addresses[0];
  if (!address) return "Address unavailable";

  return [address.name, address.street, address.city, address.country]
    .filter(Boolean)
    .join(", ");
}

export default function HomeScreen() {
  const queryClient = useQueryClient();
  const { token, logout } = useAuth();
  const cameraRef = useRef<CameraView>(null);
  const submissionLock = useRef(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [address, setAddress] = useState("Finding address...");
  const [showCamera, setShowCamera] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nearestOffice, setNearestOffice] = useState<NearestOffice | null>(null);
  const [nearestOfficeError, setNearestOfficeError] = useState<string | null>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const officesQuery = useQuery({
    queryKey: ["offices"],
    enabled: Boolean(token),
    queryFn: async () => {
      const result = await apiRequest<{ offices: Office[] }>("/geo_punch/get_offices", {
        token,
        onUnauthorized: logout,
      });
      return result.offices;
    },
  });
  const offices = officesQuery.data ?? [];

  const refreshLocation = useCallback(async () => {
    setLocationLoading(true);
    setLocationError(null);
    setLocation(null);

    try {
      let permission = await Location.getForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        permission = await Location.requestForegroundPermissionsAsync();
      }

      if (permission.status !== "granted") {
        throw new Error("Allow location access to record attendance.");
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(currentLocation);
      return currentLocation;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not read your location. Check GPS and try again.";
      setLocationError(message);
      return null;
    } finally {
      setLocationLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshLocation();
  }, [refreshLocation]);

  useEffect(() => {
    let isCurrent = true;

    if (!location) {
      setAddress("Finding address...");
      setNearestOffice(null);
      return () => {
        isCurrent = false;
      };
    }

    const { latitude, longitude } = location.coords;
    void Location.reverseGeocodeAsync({ latitude, longitude })
      .then((result) => {
        if (isCurrent) setAddress(formatAddress(result));
      })
      .catch(() => {
        if (isCurrent) setAddress("Address unavailable");
      });

    if (token) {
      void apiRequest<{ nearest_office: NearestOffice }>("/geo_punch/get_distance", {
        method: "POST",
        token,
        onUnauthorized: logout,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude, longitude }),
      })
        .then((result) => {
          if (isCurrent) {
            setNearestOffice(result.nearest_office);
            setNearestOfficeError(null);
          }
        })
        .catch((error: unknown) => {
          if (isCurrent) {
            setNearestOffice(null);
            setNearestOfficeError(error instanceof Error ? error.message : "Could not find a nearby office.");
          }
        });
    }

    return () => {
      isCurrent = false;
    };
  }, [location, logout, token]);

  const openCamera = async () => {
    if (!cameraPermission?.granted) {
      const permission = await requestCameraPermission();
      if (!permission.granted) {
        Alert.alert("Camera permission required", "Allow camera access to take an attendance selfie.");
        return;
      }
    }
    setShowCamera(true);
  };

  const takeSelfie = async () => {
    try {
      const photo = await cameraRef.current?.takePictureAsync({
        quality: 0.75,
        skipProcessing: true,
      });
      if (!photo?.uri) throw new Error("The camera did not return a photo.");

      setPhotoUri(photo.uri);
      setShowCamera(false);
    } catch (error) {
      Alert.alert("Could not take selfie", error instanceof Error ? error.message : "Please try again.");
    }
  };

  const submitAttendance = async () => {
    if (submissionLock.current || isSubmitting) return;
    if (!photoUri) {
      Alert.alert("Selfie required", "Take a selfie before submitting attendance.");
      return;
    }
    if (!token) {
      Alert.alert("Sign in required", "Please sign in again to submit attendance.");
      return;
    }

    submissionLock.current = true;
    setIsSubmitting(true);
    try {
      const currentLocation = await refreshLocation();
      if (!currentLocation) {
        throw new Error("Location is unavailable. Turn on GPS and try again.");
      }

      const formData = new FormData();
      formData.append("photo", {
        uri: photoUri,
        name: "attendance-selfie.jpg",
        type: "image/jpeg",
      } as unknown as Blob);
      formData.append("latitude", String(currentLocation.coords.latitude));
      formData.append("longitude", String(currentLocation.coords.longitude));

      await apiRequest<{ success: true }>("/geo_punch/record", {
        method: "POST",
        token,
        onUnauthorized: logout,
        body: formData,
      });

      Alert.alert("Attendance recorded", "Your attendance was submitted successfully.");
      setPhotoUri(null);
      await queryClient.invalidateQueries({ queryKey: ["attendance"] });
    } catch (error) {
      Alert.alert("Attendance not submitted", error instanceof Error ? error.message : "Please try again.");
    } finally {
      submissionLock.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
      headerImage={<Image source={require("@/assets/images/Banner.jpeg")} style={homeStyles.reactLogo} />}
    >
      <ThemedText type="title">Attendance</ThemedText>

      {photoUri && (
        <View style={{ marginTop: 20, alignItems: "center" }}>
          <Image source={{ uri: photoUri }} style={{ width: "100%", height: 300, borderRadius: 10 }} />
          <TouchableOpacity
            onPress={() => {
              setPhotoUri(null);
              void openCamera();
            }}
            style={buttonStyle}
          >
            <ThemedText style={buttonTextStyle}>Retake selfie</ThemedText>
          </TouchableOpacity>
        </View>
      )}

      {showCamera && (
        <View style={{ height: 400, marginTop: 12, overflow: "hidden", borderRadius: 12 }}>
          <CameraView ref={cameraRef} style={{ flex: 1 }} facing="front">
            <View style={cameraControlsStyle}>
              <TouchableOpacity accessibilityLabel="Close camera" style={cameraButtonStyle} onPress={() => setShowCamera(false)}>
                <Ionicons name="close" size={22} color="#000" />
              </TouchableOpacity>
              <TouchableOpacity accessibilityLabel="Take selfie" style={cameraButtonStyle} onPress={() => void takeSelfie()}>
                <Ionicons name="camera" size={22} color="#000" />
              </TouchableOpacity>
            </View>
          </CameraView>
        </View>
      )}

      {!showCamera && !photoUri && (
        <TouchableOpacity onPress={() => void openCamera()} style={[buttonStyle, { backgroundColor: "#007A74" }]}>
          <ThemedText style={buttonTextStyle}>Take selfie</ThemedText>
        </TouchableOpacity>
      )}

      <View style={[homeStyles.container, { marginTop: 20 }]}>
        {location ? (
          hasGoogleMapsApiKey ? (
            <MapView
              style={homeStyles.map}
              provider={PROVIDER_GOOGLE}
              region={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
            >
              <Marker
                coordinate={{ latitude: location.coords.latitude, longitude: location.coords.longitude }}
                title="You are here"
                description="Your current location"
                pinColor="red"
              />
              {offices.map((office) => (
                <Marker
                  key={office.id}
                  coordinate={{ latitude: office.latitude, longitude: office.longitude }}
                  title={office.name}
                  description={office.address}
                  pinColor="blue"
                />
              ))}
            </MapView>
          ) : (
            <View style={[homeStyles.loading, { padding: 16 }]}>
              <ThemedText>Map preview needs an Android Google Maps API key.</ThemedText>
              <ThemedText>
                Current coordinates: {location.coords.latitude.toFixed(5)}, {location.coords.longitude.toFixed(5)}
              </ThemedText>
            </View>
          )
        ) : (
          <View style={homeStyles.loading}>
            {locationLoading ? <ActivityIndicator /> : null}
            <ThemedText>{locationError ?? "Waiting for location..."}</ThemedText>
          </View>
        )}
      </View>

      <ThemedText>Approximate location: {address}</ThemedText>
      {!!location && (
        <ThemedText>
          GPS accuracy: {location.coords.accuracy == null ? "unknown" : `±${Math.round(location.coords.accuracy)} m`}
        </ThemedText>
      )}
      {locationError ? <ThemedText style={{ color: "#b42318" }}>{locationError}</ThemedText> : null}
      <TouchableOpacity onPress={() => void refreshLocation()} disabled={locationLoading} style={buttonStyle}>
        <ThemedText style={buttonTextStyle}>{locationLoading ? "Refreshing location..." : "Refresh location"}</ThemedText>
      </TouchableOpacity>

      {nearestOffice ? (
        <View style={homeStyles.cardContainer}>
          <Text style={homeStyles.cardLabel}>Nearest office</Text>
          <Text style={homeStyles.officeName}>{nearestOffice.office_name}</Text>
          <View style={homeStyles.addressBox}>
            <Text style={homeStyles.addressLabel}>Address</Text>
            <Text style={homeStyles.addressText}>{nearestOffice.office_address}</Text>
          </View>
          <View style={homeStyles.bottomRow}>
            <View style={homeStyles.distanceBadge}>
              <Text style={homeStyles.distanceText}>{(nearestOffice.distance / 1000).toFixed(2)} km away</Text>
            </View>
          </View>
        </View>
      ) : nearestOfficeError ? (
        <ThemedText>{nearestOfficeError}</ThemedText>
      ) : null}

      {officesQuery.isError ? <ThemedText>Could not load office locations.</ThemedText> : null}

      <TouchableOpacity
        onPress={() => void submitAttendance()}
        disabled={isSubmitting}
        style={[buttonStyle, { backgroundColor: isSubmitting ? "#7998bd" : "#007AFF" }]}
      >
        {isSubmitting ? <ActivityIndicator color="#fff" /> : <ThemedText style={buttonTextStyle}>Submit attendance</ThemedText>}
      </TouchableOpacity>
    </ParallaxScrollView>
  );
}

const buttonStyle = {
  marginTop: 10,
  width: "100%" as const,
  backgroundColor: "#007AFF",
  paddingVertical: 12,
  borderRadius: 10,
  alignItems: "center" as const,
};

const buttonTextStyle = { color: "#fff", fontWeight: "600" as const };
const cameraControlsStyle = {
  position: "absolute" as const,
  bottom: 20,
  left: 0,
  right: 0,
  flexDirection: "row" as const,
  justifyContent: "center" as const,
  gap: 24,
};
const cameraButtonStyle = {
  width: 52,
  height: 52,
  borderRadius: 26,
  backgroundColor: "#fff",
  alignItems: "center" as const,
  justifyContent: "center" as const,
};
