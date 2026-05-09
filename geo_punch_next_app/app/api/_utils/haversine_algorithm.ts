type Coordinate = {
    lat: number;
    lng: number;
};

type Office = {
    id: number;
    name: string;
    lat: number;
    lng: number;
};

function haversineDistance(a: Coordinate, b: Coordinate): number {
    const R = 6371000; // Earth radius in meters

    const toRad = (deg: number) => (deg * Math.PI) / 180;

    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);

    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);

    const h =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1) *
            Math.cos(lat2) *
            Math.sin(dLng / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));

    return R * c;
}

function findClosestOffice(
    user: Coordinate,
    offices: Office[]
) {
    let closest = null;
    let minDistance = Infinity;

    for (const office of offices) {
        const distance = haversineDistance(user, {
            lat: office.lat,
            lng: office.lng,
        });

        if (distance < minDistance) {
            minDistance = distance;
            closest = office;
        }
    }

    return {
        office: closest,
        distanceMeters: Math.round(minDistance),
    };
}