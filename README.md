# Leaflet Map Project

A interactive map created with Leaflet.js showing walking distance zones around schools in Ulaanbaatar, Mongolia. Ulaanbaatar city council declared that they will create 20 minutes walking city from each public service. I was curious enough to see how it looks like with OpenStreet data. This map has 4 different layers showing 5, 10, 15 and 20 minutes walking distance from schools. Limitation of the data is that it is not up to a date and changes have been made by city council's decision is not included in this map. However, this map is a great starting point to show how the situation is in Ulaanbaatar and could be used for further analysis to contribute the decision making. The map has 4 interactive tools such as zoom in, layer control, pop-up  and metadata information section and other non-interactive map features like legend, map title, and a scale bar.

## Interactive Features
- zoom in & out
- double click zoom in
- layer control
Implementation:

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
    
    const overlayHeader = document.createElement('h4');
    overlayHeader.textContent = 'Layers';
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

Challenges: When I opened the map no layer was added to the map, I had to add it one by one by myself.
Solution: With the help of initialize the layers to the map, 5 min distance layer and the schools appears when the map is loaded first. 

loadDistanceLayers();
loadSchoolsLayer();

walkingDistanceLayers["5min walk"].addTo(map);
schoolLayer.addTo(map);

- pop-up
Implementation:

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

Challenges: Pop-up appears when I clicked on the school icon but it doesn't show detailed information about schools.

Solution: I tried to solve the issue few times with the help of AI but couldn't resolve it. The pop-up shows same result for every schools with the same "Schools" text.

- Metadata
Implementation:

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


## Other features
- Legend
Implementation:

        <div id="legend">
            <div><i style="background: #2b83ba"></i>5 minutes</div>
            <div><i style="background: #1a9641"></i>10 minutes</div>
            <div><i style="background: #fdae61"></i>15 minutes</div>
            <div><i style="background: #d7191c"></i>20 minutes</div>
            <div><i class="fas fa-school" style="color: #5E2C5E"></i>Schools</div>
        </div>

- Scale
Implementation:

// Add scale control
L.control.scale({ position: 'bottomleft' }).addTo(map);

- Map title
Implementation:

        <div id="title">
            <h1>Walking Distance from Schools in Ulaanbaatar</h1>
        </div>

## Live Demo
[View the live map here](https://khishigbuyanaltangerel.github.io/Walking-distance-from-school-final/) 

## Technologies Used
- [Leaflet.js](https://leafletjs.com/)
- [OpenStreetMap](https://www.openstreetmap.org/) for basemap and data collection
- [ArcGISOnline](hiips:/zgis.maps.arcgis.com/) for analysis
