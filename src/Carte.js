import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './Carte.css';


// Corriger les icones Leaflet (bug webpack)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Icone orange pour l'arrêt le plus proche
const iconeProche = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});


function BoutonCentrer({ position }) {
  const map = useMap();
  if (!position) return null;
  return (
    <button
      className="btn-centrer"
      onClick={() => map.setView(position, 15)}
    >
      Centrer sur ma position
    </button>
  );
}

function calculerDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI/180) *
    Math.cos(lat2 * Math.PI/180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function Carte() {
  const [arrets, setArrets] = useState([]);
  const [positionUtilisateur, setPositionUtilisateur] = useState(null);
  const [arretsProches, setArretsProches] = useState([]);
  const DAKAR = [14.6928, -17.4467];

  // Charger les arrets depuis Flask
  useEffect(() => {
  if (positionUtilisateur && arrets.length > 0) {
    const arretsAvecDistance = arrets.map(a => ({
      ...a,
      distance: calculerDistance(
        positionUtilisateur[0], positionUtilisateur[1], a.lat, a.lon)
    }));
    const tries = arretsAvecDistance.sort((a, b) => a.distance - b.distance);
    setArretsProches(tries.slice(0, 3));
  }
}, [positionUtilisateur, arrets]);

  // Geolocalisation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setPositionUtilisateur([
            pos.coords.latitude,
            pos.coords.longitude
          ]);
        },
        () => console.log("Geolocation refusee")
      );
    }
  }, []);

  // Trouver l'arret le plus proche
  useEffect(() => {
    if (positionUtilisateur && arrets.length > 0) {
      let proche = null;
      let dMin = Infinity;
      arrets.forEach(a => {
        const d = calculerDistance(
          positionUtilisateur[0],
          positionUtilisateur[1], a.lat, a.lon);
        if (d < dMin) { dMin = d; proche = {...a, distance: d}; }
      });
    }
  }, [positionUtilisateur, arrets]);

  return (
    <div className="carte-container">
      <h2 className="carte-titre">Carte des arrêts</h2>
      {arretsProches.length > 0 && (
  <div className="arrets-proches-liste">
    <p className="arrets-proches-titre">Les 3 arrêts les plus proches :</p>
    {arretsProches.map((a, i) => (
      <p key={a.id} className="arret-proche">
        {i + 1}. <strong>{a.nom}</strong> ({a.distance.toFixed(1)} km)
      </p>
    ))}
  </div>
)}
      <MapContainer center={DAKAR} zoom={13} className="carte">
  <TileLayer
    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    attribution="&copy; OpenStreetMap"
  />
  <BoutonCentrer position={positionUtilisateur} />
  {arrets.map(a => (
  <Marker
    key={a.id}
    position={[a.lat, a.lon]}
    icon={arretsProches.length > 0 && arretsProches[0].id === a.id ? iconeProche : new L.Icon.Default()}
  >
    <Popup>
      <strong>{a.nom}</strong><br/>
      Lignes : {a.lignes.join(", ")}
    </Popup>
  </Marker>
))}
        {positionUtilisateur && (
          <Marker position={positionUtilisateur}>
            <Popup>Vous êtes ici</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}

export default Carte;