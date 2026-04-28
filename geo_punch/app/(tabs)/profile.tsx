import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { Fonts } from "@/constants/theme";
import { Image } from "expo-image";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "@/constants/API_URL";
import * as SecureStore from "expo-secure-store";
import { useQuery } from "@tanstack/react-query";

interface User {
    name: string;
    email: string | null;
    id_card_no: string | null;
    department: string | null;
    designation: string | null;
    phone_no: string | null;
};

const Row = ({ label, value }: { label: string; value?: string | null }) => (
  <View style={{ flexDirection: "row", marginBottom: 4 }}>
    <ThemedText style={{ fontWeight: "500", width: 110 }}>
      {label}:
    </ThemedText>
    <ThemedText>{value ?? "N/A"}</ThemedText>
  </View>
);

export default function ProfileScreen() {
    const { logout } = useAuth();
    
    const fetchUser = async () => {
        const token = await SecureStore.getItemAsync("token");

        const res = await fetch(`${API_URL}/geo_punch/users`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        const json = await res.json();

        if (!res.ok) {
            throw new Error(json.message || "Failed to fetch");
        }
        if (res.status === 401) {
            await logout();
            throw new Error("Unauthorized");
        }

        return json.data;
    };

    const {
        data: user = null,
    } = useQuery<User | null>({
        queryKey: ["user"],
        queryFn: fetchUser,
    });

    return (
         <ParallaxScrollView
              headerBackgroundColor={{ light: "#D0D0D0", dark: "#353636" }}
              headerImage={
                <Image
                  source={require("@/assets/images/Banner.jpeg")}
                  style={styles.reactLogo}
                />
              }
            >
            <View>
                <ThemedText
                type="title"
                style={{ fontFamily: Fonts.rounded }}
                >
                    Your Profile
                </ThemedText>
            </View>

            <View
                style={{
                backgroundColor: "#fff",
                padding: 16,
                borderRadius: 16,
                marginBottom: 12,
                elevation: 3,
                }}
            >
                <ThemedText style={{ fontSize: 24, fontWeight: "600", marginBottom: 10 }}>
                    {user?.name}
                </ThemedText>

                <Row label="Email" value={user?.email} />
                <Row label="ID Card" value={user?.id_card_no} />
                <Row label="Department" value={user?.department} />
                <Row label="Designation" value={user?.designation} />
                <Row label="Phone" value={user?.phone_no} />
            </View>

            <TouchableOpacity
              onPress={logout}
              style={{
                marginTop: 10,
                width: '100%',
                backgroundColor: '#FF0000',
                paddingVertical: 12,
                borderRadius: 10,
                alignItems: 'center',
              }}
            >
              <ThemedText style={{ color: '#fff', fontWeight: '600' }}>
                Log Out
              </ThemedText>
            </TouchableOpacity>
        </ParallaxScrollView>
    );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },  
  reactLogo: {
    height: '83%',
    width: '100%',
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
