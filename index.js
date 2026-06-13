const routesPath = 'muniRoutesNoDupes.csv';
let muniRoutes; // array
let indTarget; // index of muniRoutes
let routeNames = []; // Array of all route names
let targetName; // Name of the bus line
let pastGuesses = []; // Array of user's inputted guesses

const popup = L.popup(); // For popups
// End initialization

// Set up initial map on SF
var map = L.map('map', {
    zoomControl: false,
    // dragging: false
});
map.setView([37.801005, -122.434731], 13);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);
// Setup done.


drawTargetLine(routesPath);

const guessButton = document.getElementById('guessConfirm')
guessButton.addEventListener("click", checkGuess)

// METHODS

// Event: User submits guess. Check and print result after. Log, print all guesses. Draw guessed lines.
function checkGuess() {
    const userGuess = document.getElementById('userGuess').value.trim().toUpperCase();
    pastGuesses.push(userGuess);
    console.log(pastGuesses);

    if (userGuess.localeCompare(targetName) == 0) {
        document.getElementById('result').textContent = "Correct! You get a free bus ticket.";
    } else {
        document.getElementById('result').textContent = `Wrong! Guess again. Your previous guesses: ${pastGuesses.toString()}`;
        drawGuessLine(userGuess);
    }
}

// Event handler: Mouse hovers over a guess line. Popup with bus line.
function guessLineMouseOver(e, ind) {
    popup
        .setLatLng(e.latlng)
        .setContent(`This line is: ${muniRoutes[ind]['ROUTE_NAME']}`) // how will this function access ind?
        .openOn(map);
}

// If input bus line is valid, draws a blue line on map.
// Input: String busline
function drawGuessLine(busline) {
    for (let ind = 0; ind < muniRoutes.length; ind++) {
        if (muniRoutes[ind]['ROUTE_NAME'].localeCompare(busline) == 0) {
            const targetCoordinates = getCoordinates(muniRoutes[ind]['shape']);
            let polyline = L.polyline(targetCoordinates, {color: '#2c97f5',
                weight: 2,
            }).addTo(map);

            polyline.on('mouseover', (e) => guessLineMouseOver(e, ind));
            return;
        }
    }
}

// Helper function
// Is called by drawTargetLine(filePath)
// Parses csv asynchronously.
function parseCsv(filePath) {
    // Each element in muniRoutes will contain a string (busline) and a string (coordinates in multiline format)
    return new Promise((resolve, reject) => {
        Papa.parse(filePath, {
            download: true,
            header: true,
            skipEmptyLines: true,
            complete: function(results) {
                muniRoutes = results.data;
                resolve("Parsing done");
            },
            error: function(error) {
                reject(error);
            }
        });
    });
}

// Pushes all route names to arr routeNames.
function getRouteNames(value, index, array) {
    routeNames.push(value['ROUTE_NAME']);
}

// Draws the bus line to guess. Logs coordinates and bus line.
// Input: String filePath
async function drawTargetLine(filePath) {
    try {
        const parsingDone = await parseCsv(filePath);
        console.log(parsingDone);
        console.log(muniRoutes);

        muniRoutes.forEach(getRouteNames);
        document.getElementById('routesList').textContent = routeNames.toString();

        indTarget = randInd(muniRoutes);
        targetName = muniRoutes[indTarget]['ROUTE_NAME'];

        const targetCoordinates = getCoordinates(muniRoutes[indTarget]['shape']);
        var polyline1 = L.polyline(targetCoordinates, {color: '#ff0da6'}).addTo(map);
        map.setView(targetCoordinates[Math.floor(targetCoordinates.length / 2)], 13); // center the view on the route

        console.log('Line coordinates:');
        console.log(targetCoordinates);
        console.log(`Bus line: ${targetName}`);
    } catch(error) {
        console.error(error);
    }
}

// Input: arr
// Returns: int random index
function randInd(arr) {
    let randomNum = Math.floor(Math.random() * arr.length);
    console.log('random index: ', randomNum, typeof(randomNum));
    return randomNum;
}

// Function that gets a multiline string and returns an arr with all the coordinates of that route. Ready to be used by polyline
function getCoordinates(input) {
    const coordinatesStr = input.match(/\(\((.*?)\)\)/)[1];
        // Split into pairs and convert to [lat, lng]
    const coordinates = coordinatesStr.split(', ').map(pair => {
        const [lng, lat] = pair.split(' ').map(Number);
        return [lat, lng]; // Reverse order to [lat, lng]
    });
    return coordinates;
}

