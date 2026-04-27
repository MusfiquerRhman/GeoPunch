import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { Fonts } from "@/constants/theme";
import { Image } from "expo-image";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useAuth } from "../context/AuthContext";

export default function ProfileScreen() {
    const { logout } = useAuth();

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
