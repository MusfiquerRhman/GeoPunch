import { BASE_URL, getApiUrl } from "../constants/API_URL";

export type LocationMapProps = {
  latitude: number;
  longitude: number;
  offices: { id: number | string; name: string; address: string; latitude: number; longitude: number }[];
};

export function locationMapHtml(props: LocationMapProps) {
  // Office text must not be able to terminate the inline script.
  const data = JSON.stringify({
    ...props,
    tileUrl: BASE_URL ? getApiUrl("maps/tiles/{z}/{x}/{y}.png") : "",
  }).replace(/</g, "\\u003c");
  return `<!doctype html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="${BASE_URL}/maps/leaflet/leaflet.css">
<style>html,body,#map{height:100%;margin:0}#error{position:absolute;top:8px;left:50px;right:8px;z-index:1000;background:white;padding:8px;font:14px sans-serif}</style>
</head><body><div id="map" aria-label="Current location and offices"></div>
<div id="error" role="status">Loading map…</div>
<script src="${BASE_URL}/maps/leaflet/leaflet.js"></script>
<script>
const data = ${data};
const error = document.getElementById('error');
function showError(){error.textContent='Map unavailable. Check your internet connection. Coordinates are shown below.';error.style.display='block';}
if (!window.L || !data.tileUrl) { showError(); } else {
  const map = L.map('map').setView([data.latitude, data.longitude], 15);
  const tiles = L.tileLayer(data.tileUrl, {
    maxZoom:19,
    attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors'
  }).addTo(map);
  let failed = false;
  tiles.on('loading',function(){failed=false;});
  tiles.on('tileerror',function(){failed=true;showError();});
  tiles.on('load',function(){if(!failed)error.style.display='none';});
  L.circleMarker([data.latitude,data.longitude],{radius:9,color:'#fff',weight:3,fillColor:'#dc2626',fillOpacity:1}).addTo(map).bindPopup('You are here');
  data.offices.forEach(function(office){
    if(!Number.isFinite(office.latitude)||!Number.isFinite(office.longitude))return;
    const popup=document.createElement('div');
    const title=document.createElement('strong');
    title.textContent=office.name;
    popup.append(title,document.createElement('br'),document.createTextNode(office.address));
    L.circleMarker([office.latitude,office.longitude],{radius:8,color:'#fff',weight:2,fillColor:'#2563eb',fillOpacity:1}).addTo(map).bindPopup(popup);
  });
}
</script></body></html>`;
}
