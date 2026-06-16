// CONSTRAINTS: the csv file must have a header row with 'ROUTE_NAME', 'shape' containing multiline strings.
// Otherwise, drawTargetLine() malfunctions.

let routesPath = '';
let tmpResults; // PandaParse results
let muniRoutes = []; // Cleaned array
let indTarget; // index of muniRoutes
// let routeNames = []; // Array of all route names. Number + long name. NO LONGER NEEDED?
let targetName; // Short ID of the bus line
let pastGuesses = []; // Array of user's inputted guesses
let centerCoordinates;
let zoomLevel;

const popup = L.popup(); // For popups
// End variable declarations

// Set up initial map on SF
const muniGame = new Game('muniRoutesFull.csv', [37.801005, -122.434731], 13);
const sacGame = new Game('muniRoutesFull.csv', [38.576641094908176, -121.49348344235615], 12);
init(muniGame);
// init(sacGame);

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

// guessButton.addEventListener("click", checkGuess)
guessButton.addEventListener("click", (e) => {
    checkGuess(userGuessInput.value.trim().toUpperCase());
})


userGuessInput.addEventListener('keydown', (e) => { // If we type enter, we check as well
    if (e.key === 'Enter') {
        checkGuess(userGuessInput.value.trim().toUpperCase());
    }
})

// METHODS

// WIP Handle button input guesses.
// Event handler: User submits guess. Check and print result after.
// Log, print all guesses. Draw guessed lines.
// Input: Str userGuess (short Id)
function checkGuess(userGuess) {

    // const userGuess = userGuessInput.value.trim().toUpperCase();
    // CHANGE THIS
    
    pastGuesses.push(userGuess);
    console.log(pastGuesses);

    if (userGuess.localeCompare(targetName) == 0) {
        document.getElementById('result').textContent = "Correct! You get a free bus ticket.";
    } else {
        document.getElementById('result').textContent = `Wrong! Guess again. Your previous guesses: ${pastGuesses.toString()}`;
        drawGuessLine(userGuess);
    }
    // userGuessInput.input = "Hmmm..."; WIPPPPP
}

// Event handler: Mouse hovers over a guess line. Popup with bus line.
function guessLineMouseOver(e, ind) {
    popup
        .setLatLng(e.latlng)
        .setContent(`This line is: ${muniRoutes[ind].getId()}`) // how will this function access ind?
        .openOn(map);
}

// If input bus line is valid, draws a blue line on map.
// Input: String busline
function drawGuessLine(busline) {
    for (let ind = 0; ind < muniRoutes.length; ind++) {
        if (muniRoutes[ind].getId().localeCompare(busline) == 0) {
            const targetCoordinates = muniRoutes[ind].getCoordinates();
            const polyline = L.polyline(targetCoordinates,
                {color: '#2c97f5',
                    weight: 2
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
                tmpResults = results.data;
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
    // let tmp = `${value['ROUTE_NAME']} ${value['ROUTE_LONG_NAME']}`;


    routeNames.push(`${value['ROUTE_NAME']} ${value['ROUTE_LONG_NAME']}`);
}



// Input: arr
// Returns: int random index
function randInd(arr) {
    let randomNum = Math.floor(Math.random() * arr.length);
    console.log('random index: ', randomNum, typeof(randomNum));
    return randomNum;
}

// Function that gets a multiline string and returns an arr with all the coordinates of that route. Ready to be used by polyline
// Input: Str multiline format
// Returns: array of coordinate arrays
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

// Constructor for a transit line.
// Input: Str shortId
// Str supplement
function muniLine(shortId, supplement) {
    this.shortId = shortId;
    this.supplement = supplement;
    this.coordinates = [];
}

// muniLine class method.
// Input: arr coordinate [num, num]
muniLine.prototype.addCoordinate = function(coordinate) {
    this.coordinates.push(coordinates);
};

// muniLine class method
// Setter: arr of coordinate arrays
muniLine.prototype.setAllCoordinates = function(arr) {
    this.coordinates = arr;
};

// muniLine class method
// Returns: Str
muniLine.prototype.getLongName = function() {
    return `${this.shortId} ${this.supplement}`;
};

// muniLine class method
// Getter: Str shortId
muniLine.prototype.getId = function() {
    return this.shortId;
};

// muniLine class method
// Getter: Arr coordinates
muniLine.prototype.getCoordinates = function() {
    return this.coordinates;
};

// Draws the bus line to guess. Logs coordinates and bus line.
// Input: String filePath
async function drawTargetLine(filePath) {
    try {
        const parsingDone = await parseCsv(filePath);
        console.log(parsingDone);
        console.log("Parsed (uncleaned) results:")
        console.log(tmpResults);

        // WIP How to clean the arr if needed?
        if (filePath.localeCompare("muniRoutesFull.csv") == 0) {
            for (let i = 0; i < tmpResults.length; i++) {
                const hi = new muniLine(tmpResults[i]['ROUTE_NAME'], tmpResults[i]['ROUTE_LONG_NAME']);
                // let shape = tmpResults[i]['shape'];
                // console.log(shape);
                // console.log(hi);
                hi.setAllCoordinates(getCoordinates(tmpResults[i]['shape']));
                muniRoutes.push(hi);
            }

            console.log("Cleaned results:");
            console.log(muniRoutes);

        } else if (filePath.localeCompare("sacRTWHATEVER.csv") == 0 ) {

        }

        // Now, muniRoutes is an array of muniLine objects.
        // Update routesList with an array of all things.
        const routesList = document.getElementById('routesList');
        routesList.innerHTML = muniRoutes
            .map(line => `<button class='route-item' id='${line.getId()}' >${line.getLongName()} </button>`)
            .join('');
        


        // Bind every button to an eventHandler
        for (let i = 0; i < muniRoutes.length; i++) {
            const lineButton = document.getElementById(`${muniRoutes[i].getId()}`);
            lineButton.addEventListener("click", (e) => {
                checkGuess(muniRoutes[i].getId());
            });
        }


            // .map(name => `<div class='route-item'>${name}</div>`)
            // .join('');

        
        // pretend it's done.

        indTarget = randInd(muniRoutes);
        targetName = muniRoutes[indTarget].getId();
        const targetCoordinates = muniRoutes[indTarget].getCoordinates();

        var polyline1 = L.polyline(targetCoordinates, {color: '#ff0da6'}).addTo(map);
        map.setView(targetCoordinates[Math.floor(targetCoordinates.length / 2)], zoomLevel); // center the view on the route

        console.log('Line coordinates:');
        console.log(targetCoordinates);
        console.log(`Bus line ID: ${targetName}`);



// OLD CODE:

        // // Update html list of options.
        // muniRoutes.forEach(getRouteNames); // NO LONGER NECESSARY???
        // const routesList = document.getElementById('routesList');
        // routesList.innerHTML = routeNames
        //     .map(name => `<div class='route-item'>${name}</div>`)
        //     .join('');


        // indTarget = randInd(muniRoutes);
        // targetName = muniRoutes[indTarget]['ROUTE_NAME'];

        // const targetCoordinates = getCoordinates(muniRoutes[indTarget]['shape']); // MAYBE Integrate this into the muniRoutes cleaning??
        // var polyline1 = L.polyline(targetCoordinates, {color: '#ff0da6'}).addTo(map);
        // map.setView(targetCoordinates[Math.floor(targetCoordinates.length / 2)], zoomLevel); // center the view on the route

        // console.log('Line coordinates:');
        // console.log(targetCoordinates);
        // console.log(`Bus line: ${targetName}`);
    } catch(error) {
        console.error(error);
    }
}