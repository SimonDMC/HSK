let docRef;

let words = [];
let orderedWords = [];
let displayMode = 0;
let orderMode = 0;
let pos = 0;
let revealed = false;
let lightMode = false;
let data = {};
let settings, setsPopup;
let sets = {};
let selectedSet = "hsk4l3";
let offline = false;

// support offline
try {
    docRef = db.collection("sets").doc("main");
    getData();
} catch (e) {
    offline = true;
    console.log("Offline mode.");
    buildSets({});
    docLoad();
}

// get data from firestore
async function getData() {
    await docRef.get().then((doc) => {
        buildSets(doc.data());
        docLoad();
    });
}

// load data from local storage
if (localStorage.getItem("HSK")) {
    data = JSON.parse(localStorage.getItem("HSK"));
    displayMode = data.displayMode;
    orderMode = data.orderMode;
    pos = data.pos;
    orderedWords = data.orderedWords;
    lightMode = data.lightMode;
    selectedSet = data.selectedSet;
    if (lightMode) $(":root").addClass("light-theme");
    console.log("Loaded data from local storage.");
    console.log(data);
}

// wait until firebase data loads
function docLoad() {
    settings = new Popup({
        id: "settings",
        title: "Settings",
        content: `
          space-out§Color Scheme{btn-colorSchemeButton}[Toggle]
          space-out§Clear Storage{btn-clearStorageButton red-button}[Clear]
        `,
        titleColor: "var(--text-color)",
        backgroundColor: "var(--main-color)",
        closeColor: "var(--text-color)",
        textColor: "var(--text-color)",
        sideMargin: "8vw",
        titleMargin: "4vh",
        lineSpacing: "2.5em",
        buttonWidth: "max(11vh, 30%)",
    });

    // assign click events
    $(".switches .top .left div").click(function () {
        let index = $(this).index();
        displayMode = index;
        $(".switches .left div").removeClass("active");
        $(this).addClass("active");
        update();
    });

    $(".switches .top .right div").click(function () {
        let index = $(this).index();
        orderMode = index;
        $(".switches .right div").removeClass("active");
        $(this).addClass("active");
        reset(selectedSet);
    });

    $(".leftArrow").click(prev);
    $(".rightArrow").click(next);
    $(".center").click(flipCard);
    $(".open-settings").click(openSettings);
    $(".open-sets").click(openSets);
    $(".fullscreen").click(fullscreen);
    $(".set-btn").click(switchSets);

    // toggle color scheme button
    $(".colorSchemeButton").click(function () {
        lightMode = !lightMode;
        $(":root").toggleClass("light-theme");
        saveData();
    });

    // clear storage button
    $(".clearStorageButton").click(function () {
        localStorage.removeItem("HSK");
        window.location.reload();
    });

    init();
}

// assign arrow key presses
document.onkeydown = function (e) {
    switch (e.key) {
        case "ArrowLeft":
            prev();
            break;
        case "ArrowRight":
            next();
            break;
        default:
            return;
    }
    e.preventDefault();
};

// assign space key press
document.onkeyup = function (e) {
    switch (e.key) {
        case " ":
        case "Space":
            flipCard();
            e.preventDefault();
            break;
    }
};

// swiping - https://stackoverflow.com/a/56663695/19271522
let touchstartX = 0;
let touchendX = 0;
function checkDirection() {
    if (Math.abs(touchendX - touchstartX) < 20) return;
    if (touchendX < touchstartX) next();
    if (touchendX > touchstartX) prev();
}
document.addEventListener("touchstart", (e) => {
    touchstartX = e.changedTouches[0].screenX;
});
document.addEventListener("touchend", (e) => {
    touchendX = e.changedTouches[0].screenX;
    checkDirection();
});

// popup buttons
function openSettings() {
    settings.show();
}
function openSets() {
    setsPopup.show();
}
function fullscreen() {
    if (document.fullscreenElement) {
        document.exitFullscreen();
        $(".fullscreen").html('<i class="fa-solid fa-expand"></i>');
    } else {
        document.documentElement.requestFullscreen();
        $(".fullscreen").html('<i class="fa-solid fa-compress"></i>');
    }
}

// create sets popup and assigns sets
function buildSets(data) {
    for (let set in data) {
        // retrieve name of set from JSON
        let setData = JSON.parse(data[set]);
        let setName = setData[0];
        setData.shift();
        sets[set] = [setName, setData];
    }

    // order sets reverse alphabetically
    const ordered = Object.keys(sets)
        .sort()
        .reverse()
        .reduce((obj, key) => {
            obj[key] = sets[key];
            return obj;
        }, {});

    sets = ordered;

    // create sets popup
    let content = ``;

    for (let set in sets) content += `{btn-set-btn ${set}}[${sets[set][0]}]\n`;

    // error if no sets (offline)
    if (content == "")
        content = `error§Sets unavailable offline. 
        error§Please connect to the internet.`;

    setsPopup = new Popup({
        id: "sets",
        title: "Sets",
        content: content,
        titleColor: "var(--text-color)",
        backgroundColor: "var(--main-color)",
        closeColor: "var(--text-color)",
        textColor: "var(--text-color)",
        sideMargin: "10%",
        titleMargin: "4vh",
        lineSpacing: "0",
        buttonWidth: "100%",
    });
}

function switchSets(e) {
    let set = e.target.classList[1];
    selectedSet = set;
    $(".set-btn").removeClass("active");
    $("." + set).addClass("active");
    setsPopup.hide();
    reset(set);
}

function init() {
    // check if data is empty (not loaded from localstorage)
    if (Object.keys(data).length === 0) {
        // no loaded data
        $(".switches .top .left :nth-child(1)").addClass("active");
        $(".switches .top .right :nth-child(1)").addClass("active");
        reset(Object.keys(sets)[0]);
    } else {
        // data loaded
        $(`.switches .top .left :nth-child(${displayMode + 1})`).addClass(
            "active"
        );
        $(`.switches .top .right :nth-child(${orderMode + 1})`).addClass(
            "active"
        );
        update();
    }
}

function reset(id) {
    // copy words into ordered
    if (offline) {
        orderedWords = JSON.parse(localStorage.getItem("HSK")).orderedWords;
    } else {
        orderedWords = sets[id][1].slice();
    }

    // if shuffle is selected, shuffle copied array
    if (orderMode == 1) {
        shuffle(orderedWords);
    }

    // reset progress
    pos = 0;
    update();
}

function flipCard() {
    if (revealed) update();
    else {
        $(".main-box :nth-child(2)").text(orderedWords[pos][0]);
        $(".main-box :nth-child(3)").text(orderedWords[pos][1]);
        $(".main-box :nth-child(1)").text(orderedWords[pos][2]);
        $(".main-box :nth-child(1)").css("font-size", "1em");
        let height = $(".main-box :nth-child(1)").height();
        if (height > 150)
            $(".main-box :nth-child(1)").css(
                "font-size",
                `${1 / (1 + (height - 150) / 150)}em`
            );
        $(".main-box div").css("color", "var(--text-color)");
        revealed = true;
    }
}

function next() {
    pos += 1;
    if (pos >= orderedWords.length) pos = 0;
    update();
}

function prev() {
    pos -= 1;
    if (pos < 0) {
        pos = 0;
        return;
    }
    update();
}

function update() {
    revealed = false;

    // update progress
    $(".progress").text(pos + "/" + (orderedWords.length - 1));
    $(".fill").css("width", (100 / (orderedWords.length - 1)) * pos + "%");

    // update main box
    $(".main-box div").css("color", "var(--main-color)");
    switch (displayMode) {
        case 0:
            $(".main-box :nth-child(2)")
                .text(orderedWords[pos][0])
                .css("color", "var(--text-color)");
            break;
        case 1:
            $(".main-box :nth-child(3)")
                .text(orderedWords[pos][1])
                .css("color", "var(--text-color)");
            break;
        case 2:
            $(".main-box :nth-child(1)")
                .text(orderedWords[pos][2])
                .css("color", "var(--text-color)");
            $(".main-box :nth-child(1)").css("font-size", "1em");
            let height = $(".main-box :nth-child(1)").height();
            if (height > 150)
                $(".main-box :nth-child(1)").css(
                    "font-size",
                    `${1 / (1 + (height - 150) / 150)}em`
                );
            break;
    }

    saveData();
}

function saveData() {
    data.displayMode = displayMode;
    data.orderMode = orderMode;
    data.pos = pos;
    data.orderedWords = orderedWords;
    data.lightMode = lightMode;
    data.selectedSet = selectedSet;
    localStorage.setItem("HSK", JSON.stringify(data));
}

/* utility functions */

// https://stackoverflow.com/a/2450976
function shuffle(array) {
    let currentIndex = array.length,
        randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex != 0) {
        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex],
            array[currentIndex],
        ];
    }

    return array;
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
