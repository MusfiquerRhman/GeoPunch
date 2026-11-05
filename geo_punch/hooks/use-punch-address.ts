import { useQuery } from "@tanstack/react-query";
import * as Location from "expo-location";
import { validCoordinates, type AttendanceRecord } from "@/utils/attendanceHistory";

export function usePunchAddress(record: AttendanceRecord) {
  const saved = record.address?.trim();
  const lookup = useQuery({
    queryKey: ["attendance-address", record.latitude, record.longitude],
    enabled: !saved && validCoordinates(record),
    staleTime: Infinity,
    retry: false,
    queryFn: async () => {
      // History uses saved locations; never prompt for the employee's current GPS.
      const permission = await Location.getForegroundPermissionsAsync();
      if (permission.status !== "granted") return "Address unavailable";
      const [place] = await Location.reverseGeocodeAsync({ latitude: record.latitude, longitude: record.longitude });
      return place ? [place.name, place.street, place.city, place.country].filter(Boolean).join(", ") || "Address unavailable" : "Address unavailable";
    },
  });
  return saved || lookup.data || (lookup.isFetching ? "Looking up address…" : "Address unavailable");
}
