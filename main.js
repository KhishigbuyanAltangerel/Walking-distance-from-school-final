// Initialize the map centered on Ulaanbaatar
const map = L.map('map').setView([47.8864, 106.9057], 12);

// Add base layers
const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
});

const terrain = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
});

// Add base layers to map
osm.addTo(map);

const baseLayers = {
    "Street Map": osm,
    "Satellite": satellite,
    "Terrain": terrain
};

// Create layer groups
const walkingDistanceLayers = {
    "5min walk": L.layerGroup(),
    "10min walk": L.layerGroup(),
    "15min walk": L.layerGroup(),
    "20min walk": L.layerGroup()
};

const schoolLayer = L.layerGroup();

// Custom school icon
const schoolIcon = L.divIcon({
    className: 'school-marker',
    html: '<i class="fas fa-school"></i>',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
});

// Style functions
function styleDistanceLayer(color) {
    return {
        fillColor: color,
        color: color,
        weight: 1,
        opacity: 1,
        fillOpacity: 0.7
    };
}

// Load walking distance layers
function loadDistanceLayers() {
    const distanceStyles = {
        "5min": "#FF6B6B",
        "10min": "#FFA36B",
        "15min": "#FFD56B",
        "20min": "#A3D8A3"
    };

    Object.keys(distanceStyles).forEach(time => {
        fetch(`data/${time}_fromschool.geojson`)
            .then(response => response.json())
            .then(data => {
                L.geoJSON(data, {
                    style: styleDistanceLayer(distanceStyles[time]),
                    className: `distance-${time}`
                }).addTo(walkingDistanceLayers[`${time} walk`]);
            })
            .catch(error => console.error(`Error loading ${time} GeoJSON:`, error));
    });
}

// Load schools layer with custom icon and detailed popup
function loadSchoolsLayer() {
    fetch('data/Schools_UB.geojson')
        .then(response => response.json())
        .then(data => {
            L.geoJSON(data, {
                pointToLayer: function(feature, latlng) {
                    return L.marker(latlng, {
                        icon: schoolIcon
                    });
                },
                onEachFeature: function(feature, layer) {
                    if (feature.properties) {
                        const props = feature.properties;
                        let popupContent = `<div class="school-popup">`;
                        
                        // School name (required)
                        popupContent += `<h4>${props.name || 'School'}</h4>`;
                        
                        // School type if available
                        if (props.type) {
                            popupContent += `<p><i class="fas fa-graduation-cap"></i> Type: ${props.type}</p>`;
                        }
                        
                        // Address if available
                        if (props.address) {
                            popupContent += `<p><i class="fas fa-map-marker-alt"></i> ${props.address}</p>`;
                        }
                        
                        // Capacity if available
                        if (props.capacity) {
                            popupContent += `<p><i class="fas fa-users"></i> Capacity: ${props.capacity}</p>`;
                        }
                        
                        // Grade levels if available
                        if (props.grades) {
                            popupContent += `<p><i class="fas fa-layer-group"></i> Grades: ${props.grades}</p>`;
                        }
                        
                        // Establishment year if available
                        if (props.year) {
                            popupContent += `<p><i class="fas fa-calendar"></i> Established: ${props.year}</p>`;
                        }
                        
                        popupContent += `</div>`;
                        layer.bindPopup(popupContent);
                    }
                }
            }).addTo(schoolLayer);
        })
        .catch(error => console.error('Error loading schools GeoJSON:', error));
}

// Initialize layers
loadDistanceLayers();
loadSchoolsLayer();

// Add default visible layers
walkingDistanceLayers["5min walk"].addTo(map);
schoolLayer.addTo(map);

// Create overlay layers object
const overlayLayers = {
    ...walkingDistanceLayers,
    "Schools": schoolLayer
};

// Add layer control to map
L.control.layers(baseLayers, overlayLayers).addTo(map);

// Create custom layer control panel
function createLayerControlPanel() {
    const layerList = document.getElementById('layer-list');
    
    // Add base layers
    layerList.innerHTML = '<h4>Base Maps</h4>';
    Object.keys(baseLayers).forEach(layerName => {
        const item = document.createElement('div');
        item.className = 'layer-item';
        
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'baseLayer';
        radio.id = `base-${layerName.replace(/\s+/g, '-')}`;
        if (layerName === "Street Map") radio.checked = true;
        
        radio.addEventListener('change', () => {
            if (radio.checked) {
                Object.keys(baseLayers).forEach(key => {
                    if (map.hasLayer(baseLayers[key])) {
                        map.removeLayer(baseLayers[key]);
                    }
                });
                baseLayers[layerName].addTo(map);
            }
        });
        
        const label = document.createElement('label');
        label.htmlFor = radio.id;
        label.textContent = layerName;
        
        item.appendChild(radio);
        item.appendChild(label);
        layerList.appendChild(item);
    });
    
    // Add overlay layers
    const overlayHeader = document.createElement('h4');
    overlayHeader.textContent = 'Overlays';
    layerList.appendChild(overlayHeader);
    
    Object.keys(overlayLayers).forEach(layerName => {
        const item = document.createElement('div');
        item.className = 'layer-item';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `overlay-${layerName.replace(/\s+/g, '-')}`;
        
        // Set 5min and Schools layers to checked by default
        if (layerName === "5min walk" || layerName === "Schools") {
            checkbox.checked = true;
        }
        
        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                overlayLayers[layerName].addTo(map);
            } else {
                map.removeLayer(overlayLayers[layerName]);
            }
        });
        
        const label = document.createElement('label');
        label.htmlFor = checkbox.id;
        label.textContent = layerName;
        
        item.appendChild(checkbox);
        item.appendChild(label);
        layerList.appendChild(item);
    });
}

// Initialize the custom layer control panel
createLayerControlPanel();

// Add scale control
L.control.scale({ position: 'bottomleft' }).addTo(map);

// Info panel functionality (moved to top right)
const infoButton = document.getElementById('info-button');
const infoPanel = document.getElementById('info-panel');
const closeInfo = document.getElementById('close-info');

function toggleInfoPanel() {
    if (infoPanel.style.display === 'block') {
        infoPanel.style.display = 'none';
        map.dragging.enable();
        map.scrollWheelZoom.enable();
    } else {
        infoPanel.style.display = 'block';
        map.dragging.disable();
        map.scrollWheelZoom.disable();
    }
}

infoButton.addEventListener('click', function(e) {
    e.stopPropagation();
    toggleInfoPanel();
});

closeInfo.addEventListener('click', function(e) {
    e.stopPropagation();
    toggleInfoPanel();
});

map.on('click', function() {
    if (infoPanel.style.display === 'block') {
        toggleInfoPanel();
    }
});

infoPanel.addEventListener('click', function(e) {
    e.stopPropagation();
});