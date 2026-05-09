import { StyleSheet } from 'react-native';

export const homeStyles = StyleSheet.create({
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
  cardContainer: {
    backgroundColor: "#FEFEFE",
    marginTop: 16,
    padding: 20,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },

  cardLabel: {
    color: "#a1a1aa",
    fontSize: 14,
    marginBottom: 6,
  },

  officeName: {
    color: "#18181b",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 16,
  },

  addressBox: {
    backgroundColor: "#EFEFEF",
    padding: 16,
    borderRadius: 16,
    marginBottom: 18,
  },

  addressLabel: {
    color: "#a1a1aa",
    fontSize: 13,
    marginBottom: 4,
  },

  addressText: {
    color: "#18181b",
    fontSize: 16,
    lineHeight: 22,
  },

  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  distanceBadge: {
    backgroundColor: "rgba(16,185,129,0.15)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.3)",
  },

  distanceText: {
    color: "#34d399",
    fontSize: 14,
    fontWeight: "600",
  },

  nearbyBadge: {
    backgroundColor: "rgba(59,130,246,0.15)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.3)",
  },

  nearbyText: {
    color: "#60a5fa",
    fontSize: 14,
    fontWeight: "600",
  },
});
