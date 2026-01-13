// PLAK HIER DE LINK NAAR JE MODEL
const URL = "https://teachablemachine.withgoogle.com/models/8HZTzcbC_/";

let model, webcam, ctx, maxPredictions, letterContainer;
let retryCount = 0;
let predictionInterval; // Store interval ID

const interactie = ["I", "N", "T"];
let interactieCount = 0;

// Koppeling: letter -> afbeelding
const letterToImage = {
  I: "images/wakker.png",
  N: "images/slapen.png",
  T: "images/uitbed.png",
};

const init = async () => {
  try {
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    try {
      model = await tmPose.load(modelURL, metadataURL);
      maxPredictions = model.getTotalClasses();
    } catch (error) {
      console.log("Heb je wel je URL aangepast?");
    }

    // Hoe groot hoort het canvas te zijn
    const size = 400;
    // Flipt de camera
    const flip = true;
    webcam = new tmPose.Webcam(size, size, flip);
    await webcam.setup();
    await webcam.play();
    window.requestAnimationFrame(loop);

    const canvas = document.querySelector("canvas");
    canvas.width = size;
    canvas.height = size;
    ctx = canvas.getContext("2d");

    // Hier komt je letter/afbeelding in
    letterContainer = document.getElementById("letterbox");

    predictionInterval = setInterval(predict, 5000);
  } catch (error) {
    retryCount++;
    setTimeout(() => {
      if (retryCount < 3) {
        console.log(error, "retrying in 2 seconds");
        init();
      }
    }, 2000);
    // retry
  }
};

// Hier wordt bepaald welke letter wordt uitgebeeld
const loop = async (timestamp) => {
  webcam.update(); // update the webcam frame
  await drawPose();
  window.requestAnimationFrame(loop);
};

const predict = async () => {
  if (!model || !webcam) {
    console.warn("Model or webcam not initialized yet");
    return;
  }

  const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);

  const prediction = await model.predict(posenetOutput);
  var result = Math.max(...prediction.map((o) => o.probability));
  var obj = prediction.find((obj) => obj.probability === result);

  const predictedLetter = obj.className;

  spellIt(predictedLetter);
  InteractieSpeller(predictedLetter);
};

// Hier slaan we de letter globaal op
// Globaal houdt in dat alle functies deze kunnen gebruiken
let previousLetter = "";

const spellIt = (letter) => {
  if (letter !== previousLetter) {
    const previousElement = document.querySelector(".previous");
    if (previousElement) {
      previousElement.innerHTML = "";
    }

    const imgSrc = letterToImage[letter];
    if (!imgSrc) return; // als er iets anders binnenkomt, doe niks

    if (document.startViewTransition) {
      document.startViewTransition(() => {
        letterContainer.innerHTML = `
          <img src="${imgSrc}" alt="${letter}" class="state-img" />
        `;
        previousLetter = letter;
      });
    } else {
      letterContainer.innerHTML = `
        <img src="${imgSrc}" alt="${letter}" class="state-img" />
      `;
      previousLetter = letter;
    }
  }
};

const drawPose = async () => {
  const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
  if (webcam.canvas) {
    ctx.drawImage(webcam.canvas, 0, 0);
    // draw the keypoints and skeleton
    if (pose) {
      const minPartConfidence = 0.5;
      tmPose.drawKeypoints(pose.keypoints, minPartConfidence, ctx);
      tmPose.drawSkeleton(pose.keypoints, minPartConfidence, ctx);
    }
  }
};

const interactieBox = document.querySelector(".interactie");

/* =========================
   ALLEEN OPTIE A TOEGEPAST:
   - geen einde
   - altijd 1 afbeelding linksonder (vervangen)
   ========================= */
const InteractieSpeller = (letter) => {
  const normalized = letter.toUpperCase();
  const imgSrc = letterToImage[normalized];
  if (!imgSrc) return;

  // altijd maar 1 afbeelding laten zien (vervangen)
  interactieBox.innerHTML = "";

  const img = document.createElement("img");
  img.src = imgSrc;
  img.alt = normalized;
  img.classList.add("letter-img");
  interactieBox.appendChild(img);
};

init();

const images = [
  "images/ogenlinks.png",

  "images/ogenonder.png",
  "images/ogenrechts.png",
];

let currentIndex = 0;
const imgElement = document.getElementById("ogenImg");

setInterval(() => {
  // start fade
  imgElement.style.opacity = 0;

  setTimeout(() => {
    // wissel afbeelding TERWIJL hij fade't
    currentIndex = (currentIndex + 1) % images.length;
    imgElement.src = images[currentIndex];

    // direct weer zichtbaar
    imgElement.style.opacity = 1;
  }, 50); // super korte delay, geen leeg moment
}, 5000);
