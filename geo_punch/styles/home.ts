import { StyleSheet } from 'react-native';

export const homeStyles = StyleSheet.create({
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#e6f5f1',
    borderWidth: 1,
    borderColor: '#c5e8df',
  },
  successTitle: {
    color: '#0f766e',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  successMessage: {
    color: '#263632',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
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
    overflow: 'hidden',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5ece9',
    backgroundColor: '#fff',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f7faf9',
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
    backgroundColor: "#fff",
    marginTop: 8,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e5ece9",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 9,
    elevation: 1,
  },

  cardLabel: {
    color: "#66736f",
    fontSize: 14,
    marginBottom: 6,
  },

  officeName: {
    color: "#18181b",
    fontSize: 21,
    fontWeight: "700",
    marginBottom: 16,
  },

  addressBox: {
    backgroundColor: "#f5f8f7",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e8efec",
    marginBottom: 18,
  },

  addressLabel: {
    color: "#66736f",
    fontSize: 13,
    marginBottom: 4,
  },

  addressText: {
    color: "#263632",
    fontSize: 16,
    lineHeight: 22,
  },

  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  distanceBadge: {
    backgroundColor: "#e6f5f1",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#c5e8df",
  },

  distanceText: {
    color: "#0f766e",
    fontSize: 14,
    fontWeight: "600",
  },

  nearbyBadge: {
    backgroundColor: "#eff6ff",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#dbeafe",
  },

  nearbyText: {
    color: "#1d4ed8",
    fontSize: 14,
    fontWeight: "600",
  },
  locationDetails: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e5ece9',
    backgroundColor: '#fff',
    gap: 8,
  },
  locationLabel: {
    color: '#66736f',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  locationValue: {
    color: '#263632',
    fontSize: 14,
    lineHeight: 20,
  },
});
