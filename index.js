// CONSTRAINTS: the csv file must have a header row with 'ROUTE_NAME', 'shape' containing multiline strings.
// Otherwise, drawTargetLine() malfunctions.

let routesPath = '';
let muniRoutes; // array
let indTarget; // index of muniRoutes
let routeNames = []; // Array of all route names
let targetName; // Name of the bus line
let pastGuesses = []; // Array of user's inputted guesses
let centerCoordinates;
let zoomLevel;

const popup = L.popup(); // For popups
// End variable declarations

// Set up initial map on SF
const muniGame = new Game('muniRoutesNoDupes.csv', [37.801005, -122.434731], 13);
const sacGame = new Game('muniRoutesNoDupes.csv', [38.576641094908176, -121.49348344235615], 12);
// init(muniGame);
init(sacGame);

var map = L.map('map', {
    zoomControl: false,
    // dragging: false
});
map.setView(centerCoordinates, zoomLevel);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);
// Setup done.


drawTargetLine(routesPath);

const userGuessInput = document.getElementById('userGuess') // link with html id
const guessButton = document.getElementById('guessConfirm') // link with html id

guessButton.addEventListener("click", checkGuess)
userGuessInput.addEventListener('keydown', (e) => { // If we type enter, we check as well
    if (e.key === 'Enter') {
        checkGuess();
    }
})

// METHODS

// Event handler: User submits guess. Check and print result after.
// Log, print all guesses. Draw guessed lines.
function checkGuess() {
    const userGuess = userGuessInput.value.trim().toUpperCase();
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
        map.setView(targetCoordinates[Math.floor(targetCoordinates.length / 2)], zoomLevel); // center the view on the route

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

// Initializes our variable according to the game/city we want to play.
function init(game) {
    routesPath = game.routesPath;
    centerCoordinates = game.centerCoordinates;
    zoomLevel = game.zoomLevel;
    // If mobile: zoom out slightly
    if (/Mobi|Android/i.test(navigator.userAgent)) {
        zoomLevel--;
    }

}

// Constructor for a game. Each game has a separate city and bus lines.
function Game(filePath, coordinates, zoomLevel = 13) {
    this.routesPath = filePath;
    this.centerCoordinates = coordinates;
    this.zoomLevel = zoomLevel;
}