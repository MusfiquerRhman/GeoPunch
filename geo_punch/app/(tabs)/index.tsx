import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, ActivityIndicator, Keyboard, Platform, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";
import { Image } from "expo-image";
import { File } from "expo-file-system";
import { setStatusBarStyle } from "expo-status-bar";
import LocationMap from "@/components/location-map";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import ParallaxScrollView from "@/components/parallax-scroll-view";
import SelfieCamera from "@/components/selfie-camera";
import { ThemedText } from "@/components/themed-text";
import TodayPunchSummary from "@/components/today-punch-summary";
import TabHeaderImage from "@/components/tab-header-image";
import { ApiError, apiRequest } from "@/constants/apiRequest";
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

function formatAddress(addresses: Location.LocationGeocodedAddress[]) {
  const address = addresses[0];
  if (!address) return "Address unavailable";

  return [address.name, address.street, address.city, address.country]
    .filter(Boolean)
    .join(", ") || "Address unavailable";
}

export default function HomeScreen() {
  const queryClient = useQueryClient();
  const { token, logout } = useAuth();
  const cameraOpening = useRef(false);
  const submissionLock = useRef(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [address, setAddress] = useState("Finding address...");
  const [showCamera, setShowCamera] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
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
    setAddress("Finding address...");

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
      const currentAddress = await Location.reverseGeocodeAsync(currentLocation.coords)
        .then(formatAddress)
        .catch(() => "Address unavailable");
      setAddress(currentAddress);
      return { location: currentLocation, address: currentAddress };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not read your location. Check GPS and try again.";
      setLocationError(message);
      setAddress("Address unavailable");
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
      setNearestOffice(null);
      setIsFindingOffice(false);
      return () => {
        isCurrent = false;
      };
    }

    const { latitude, longitude } = location.coords;
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
    if (cameraOpening.current || submissionLock.current) return;
    cameraOpening.current = true;
    Keyboard.dismiss();
    try {
      if (!cameraPermission?.granted) {
        const permission = await requestCameraPermission();
        if (!permission.granted) {
          Alert.alert("Camera permission required", "Allow camera access to take an attendance selfie.");
          return;
        }
      }
      // Android's modal copies the activity's status-bar style when it opens.
      if (Platform.OS === "android") setStatusBarStyle("light");
      setShowCamera(true);
    } catch {
      Alert.alert("Could not open camera", "Check your camera permissions and try again.");
    } finally {
      cameraOpening.current = false;
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
    Keyboard.dismiss();
    const hasNotes = Boolean(notes.trim());
    try {
      const currentPosition = await refreshLocation();
      if (!currentPosition) {
        throw new Error("Location is unavailable. Turn on GPS and try again.");
      }
      const { location: currentLocation, address: currentAddress } = currentPosition;

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
      if (currentAddress !== "Address unavailable") {
        formData.append("address", currentAddress);
      }
      if (hasNotes) formData.append("notes", notes);

      // Older servers silently ignore notes on the original endpoint.
      const path = hasNotes ? "/geo_punch/record/with-notes" : "/geo_punch/record";
      await apiRequest<{ success: true }>(path, {
        method: "POST",
        token,
        onUnauthorized: logout,
        body: formData,
      });

      setAttendanceSubmitted(true);
      Alert.alert("Attendance recorded", "Your attendance was submitted successfully.");
      setPhotoUri(null);
      setNotes("");
      await queryClient.invalidateQueries({ queryKey: ["attendance"] });
    } catch (error) {
      const serverNeedsUpdate = hasNotes && error instanceof ApiError && (error.status === 404 || error.status === 405);
      Alert.alert(
        "Attendance not submitted",
        serverNeedsUpdate
          ? "This server needs an update to save punch notes. Your note is still in the form."
          : error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      submissionLock.current = false;
      setIsSubmitting(false);
    }
  };

  const attendanceForm = (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#fff", dark: "#fff" }}
      headerImage={<TabHeaderImage />}
      automaticallyAdjustKeyboardInsets
      keyboardShouldPersistTaps="handled"
    >
      <ThemedText type="title">Attendance</ThemedText>
      <TodayPunchSummary token={token} onUnauthorized={logout} />
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
            accessibilityRole="button"
            disabled={isSubmitting}
            onPress={() => void openCamera()}
            style={buttonStyle}
          >
            <ThemedText style={buttonTextStyle}>Retake selfie</ThemedText>
          </TouchableOpacity>
        </View>
      )}

      {!showCamera && !photoUri && (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Take selfie"
          disabled={isSubmitting}
          onPress={() => void openCamera()}
          style={buttonStyle}
        >
          <Ionicons name="camera-outline" size={19} color="#fff" />
          <ThemedText style={buttonTextStyle}>Take selfie</ThemedText>
        </TouchableOpacity>
      )}

      <View style={[homeStyles.container, { marginTop: 20 }]}>
        {location ? (
          <LocationMap latitude={location.coords.latitude} longitude={location.coords.longitude} offices={offices} />
        ) : (
          <View style={homeStyles.loading}>
            {locationLoading ? <ActivityIndicator color="#0f766e" /> : null}
            <ThemedText>{locationLoading ? "Getting your current location…" : "Location not available"}</ThemedText>
          </View>
        )}
      </View>

      <View style={homeStyles.stepContainer}>
        <ThemedText style={homeStyles.locationLabel}>Punch notes (optional)</ThemedText>
        <TextInput
          accessibilityLabel="Punch notes (optional)"
          multiline
          maxLength={2000}
          editable={!isSubmitting}
          value={notes}
          onChangeText={setNotes}
          placeholder="Add a note for this punch"
          placeholderTextColor="#66736f"
          style={homeStyles.notesInput}
        />
        <ThemedText style={homeStyles.notesHint}>Visible to admins and in your History.</ThemedText>
      </View>

      <View style={homeStyles.locationDetails}>
        <ThemedText style={homeStyles.locationLabel}>Current location</ThemedText>
        <ThemedText style={homeStyles.locationValue}>{address}</ThemedText>
        {!!location && (
          <ThemedText style={{ color: "#66736f", fontSize: 12 }}>
            Coordinates: {location.coords.latitude.toFixed(5)}, {location.coords.longitude.toFixed(5)}
          </ThemedText>
        )}
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

  return (
    <>
      {attendanceForm}
      {showCamera && (
        <SelfieCamera
          onClose={() => setShowCamera(false)}
          onUsePhoto={(uri) => {
            setPhotoUri(uri);
            setAttendanceSubmitted(false);
            setShowCamera(false);
          }}
        />
      )}
    </>
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
