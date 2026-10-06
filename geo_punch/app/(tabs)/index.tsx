import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";
import { Image } from "expo-image";
import { File } from "expo-file-system";
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
  const [attendanceSubmitted, setAttendanceSubmitted] = useState(false);
  const [nearestOffice, setNearestOffice] = useState<NearestOffice | null>(null);
  const [nearestOfficeError, setNearestOfficeError] = useState<string | null>(null);
  const [isFindingOffice, setIsFindingOffice] = useState(false);
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
      setIsFindingOffice(false);
      return () => {
        isCurrent = false;
      };
    }

    const { latitude, longitude } = location.coords;
    setAddress("Finding address...");
    void Location.reverseGeocodeAsync({ latitude, longitude })
      .then((result) => {
        if (isCurrent) setAddress(formatAddress(result));
      })
      .catch(() => {
        if (isCurrent) setAddress("Address unavailable");
      });

    if (token) {
      setNearestOffice(null);
      setNearestOfficeError(null);
      setIsFindingOffice(true);
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
            setIsFindingOffice(false);
          }
        })
        .catch((error: unknown) => {
          if (isCurrent) {
            setNearestOffice(null);
            setNearestOfficeError(error instanceof Error ? error.message : "Could not find a nearby office.");
            setIsFindingOffice(false);
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
        // Convert emulator PNG captures to JPEG before uploading as image/jpeg.
        skipProcessing: false,
        imageType: "jpg",
      });
      if (!photo?.uri) throw new Error("The camera did not return a photo.");

      setPhotoUri(photo.uri);
      setAttendanceSubmitted(false);
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
      const photoFile = new File(photoUri);
      if (!photoFile.exists || photoFile.size === 0) {
        throw new Error("The selfie file is unavailable. Retake your selfie and try again.");
      }
      if (photoFile.size > 5 * 1024 * 1024) {
        throw new Error("The selfie is larger than 5 MB. Retake your selfie and try again.");
      }
      formData.append("photo", photoFile, "attendance-selfie.jpg");
      formData.append("latitude", String(currentLocation.coords.latitude));
      formData.append("longitude", String(currentLocation.coords.longitude));

      await apiRequest<{ success: true }>("/geo_punch/record", {
        method: "POST",
        token,
        onUnauthorized: logout,
        body: formData,
      });

      setAttendanceSubmitted(true);
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
      headerBackgroundColor={{ light: "#dff3ef", dark: "#203b35" }}
      headerImage={<Image source={require("@/assets/images/Banner.jpeg")} style={homeStyles.reactLogo} />}
    >
      <ThemedText type="title">Attendance</ThemedText>
      {attendanceSubmitted && (
        <View accessibilityLiveRegion="polite" style={homeStyles.successBanner}>
          <Ionicons name="checkmark-circle" size={26} color="#0f766e" />
          <View style={{ flex: 1 }}>
            <ThemedText style={homeStyles.successTitle}>Attendance submitted successfully</ThemedText>
            <ThemedText style={homeStyles.successMessage}>Your check-in is recorded. You can view it in History.</ThemedText>
          </View>
        </View>
      )}
      <ThemedText style={{ marginTop: -6, color: "#66736f", fontSize: 14 }}>
        {attendanceSubmitted
          ? "Take a new selfie when you’re ready for another check-in."
          : "Take a selfie and confirm your current location to check in."}
      </ThemedText>

      {photoUri && (
        <View style={{ marginTop: 4, alignItems: "center", borderRadius: 18, borderWidth: 1, borderColor: "#e5ece9", padding: 12, backgroundColor: "#fff" }}>
          <Image source={{ uri: photoUri }} style={{ width: "100%", height: 280, borderRadius: 14, backgroundColor: "#f1f5f4" }} contentFit="cover" />
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
        <TouchableOpacity accessibilityRole="button" onPress={() => void openCamera()} style={buttonStyle}>
          <Ionicons name="camera-outline" size={19} color="#fff" />
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
            {locationLoading ? <ActivityIndicator color="#0f766e" /> : null}
            <ThemedText>{locationLoading ? "Getting your current location…" : "Location not available"}</ThemedText>
          </View>
        )}
      </View>

      <View style={homeStyles.locationDetails}>
        <ThemedText style={homeStyles.locationLabel}>Current location</ThemedText>
        <ThemedText style={homeStyles.locationValue}>{address}</ThemedText>
        {!!location && (
          <ThemedText style={{ color: "#66736f", fontSize: 12 }}>
            GPS accuracy {location.coords.accuracy == null ? "unavailable" : `±${Math.round(location.coords.accuracy)} m`}
          </ThemedText>
        )}
        {locationError ? <ThemedText style={{ color: "#b42318", fontSize: 13 }}>{locationError}</ThemedText> : null}
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => void refreshLocation()}
          disabled={locationLoading}
          style={[secondaryButtonStyle, locationLoading && { opacity: 0.65 }]}
        >
          {locationLoading ? <ActivityIndicator size="small" color="#0f766e" /> : <Ionicons name="refresh-outline" size={17} color="#0f766e" />}
          <ThemedText style={secondaryButtonTextStyle}>{locationLoading ? "Refreshing location…" : "Refresh location"}</ThemedText>
        </TouchableOpacity>
      </View>

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
      ) : isFindingOffice ? (
        <View style={[homeStyles.locationDetails, { flexDirection: "row", alignItems: "center" }]}>
          <ActivityIndicator size="small" color="#0f766e" />
          <ThemedText style={homeStyles.locationValue}>Finding the nearest office…</ThemedText>
        </View>
      ) : nearestOfficeError ? (
        <View style={noticeStyle}>
          <ThemedText style={{ color: "#92400e", fontSize: 13 }}>{nearestOfficeError}</ThemedText>
        </View>
      ) : null}

      {officesQuery.isLoading ? (
        <View style={[homeStyles.locationDetails, { flexDirection: "row", alignItems: "center" }]}>
          <ActivityIndicator size="small" color="#0f766e" />
          <ThemedText style={homeStyles.locationValue}>Loading office locations…</ThemedText>
        </View>
      ) : null}

      {officesQuery.isError ? (
        <View style={noticeStyle}>
          <ThemedText style={{ color: "#b42318", fontSize: 13 }}>Couldn’t load office locations.</ThemedText>
          <TouchableOpacity onPress={() => void officesQuery.refetch()}>
            <ThemedText style={{ color: "#0f766e", fontWeight: "700" }}>Try again</ThemedText>
          </TouchableOpacity>
        </View>
      ) : null}

      <TouchableOpacity
        onPress={() => void submitAttendance()}
        disabled={isSubmitting}
        style={[buttonStyle, { marginTop: 2, opacity: isSubmitting ? 0.7 : 1 }]}
      >
        {isSubmitting ? <ActivityIndicator color="#fff" /> : <ThemedText style={buttonTextStyle}>Submit attendance</ThemedText>}
      </TouchableOpacity>
    </ParallaxScrollView>
  );
}

const buttonStyle = {
  marginTop: 10,
  width: "100%" as const,
  backgroundColor: "#0f766e",
  paddingVertical: 14,
  borderRadius: 14,
  alignItems: "center" as const,
  justifyContent: "center" as const,
  flexDirection: "row" as const,
  gap: 8,
  shadowColor: "#0f766e",
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.13,
  shadowRadius: 7,
  elevation: 2,
};

const buttonTextStyle = { color: "#fff", fontWeight: "600" as const };
const secondaryButtonStyle = {
  alignSelf: "flex-start" as const,
  flexDirection: "row" as const,
  alignItems: "center" as const,
  gap: 7,
  marginTop: 4,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: "#c5e8df",
  backgroundColor: "#f3fbf8",
  paddingHorizontal: 13,
  paddingVertical: 9,
};
const secondaryButtonTextStyle = { color: "#0f766e", fontWeight: "600" as const, fontSize: 13 };
const noticeStyle = {
  flexDirection: "row" as const,
  alignItems: "center" as const,
  justifyContent: "space-between" as const,
  gap: 12,
  padding: 14,
  borderRadius: 14,
  borderWidth: 1,
  borderColor: "#e5ece9",
  backgroundColor: "#fff",
};
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
