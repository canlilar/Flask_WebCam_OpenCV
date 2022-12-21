// This one doesn't show the teachable machine canvas at all

// More API functions here:
// https://github.com/googlecreativelab/teachablemachine-community/tree/master/libraries/pose

// the link to your model provided by Teachable Machine export panel
const URL = "https://teachablemachine.withgoogle.com/models/CvlC5wCam/"; //"./my_model/";
let model, webcam, ctx, labelContainer, maxPredictions;

const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');
let armsInAV = false;
let poseType = "arms"

function onResults(results) {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(
      results.image, 0, 0, canvasElement.width, canvasElement.height);
      
  if (results.multiFaceLandmarks && armsInAV) {
    for (const landmarks of results.multiFaceLandmarks) {
      drawConnectors(canvasCtx, landmarks, FACEMESH_TESSELATION,
                     {color: '#C0C0C070', lineWidth: 1});
      drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_EYE, {color: '#FF3030'});
      drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_EYEBROW, {color: '#FF3030'});
      drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_IRIS, {color: '#FF3030'});
      drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_EYE, {color: '#30FF30'});
      drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_EYEBROW, {color: '#30FF30'});
      drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_IRIS, {color: '#30FF30'});
      drawConnectors(canvasCtx, landmarks, FACEMESH_FACE_OVAL, {color: '#E0E0E0'});
      drawConnectors(canvasCtx, landmarks, FACEMESH_LIPS, {color: '#E0E0E0'});
    }
  }
  canvasCtx.restore();
}

const faceMesh = new FaceMesh({locateFile: (file) => {
  return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
}});
faceMesh.setOptions({
  maxNumFaces: 1,
  refineLandmarks: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});
faceMesh.onResults(onResults);


const camera = new Camera(videoElement, {
  onFrame: async () => {
    await faceMesh.send({image: videoElement});
  },
  width: 1280,
  height: 720
});
camera.start();



// //  Teachable Machine
async function init() {
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    // load the model and metadata
    // Refer to tmImage.loadFromFiles() in the API to support files from a file picker
    // Note: the pose library adds a tmPose object to your window (window.tmPose)
    model = await tmPose.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();

    // Convenience function to setup a webcam
    // const size = 8000;
    // const width = window.innerWidth; // set window size automatically to users full width and height
    // const height = window.innerHeight;
    const width = 1280;
    const height = 720;
    const flip = true; // whether to flip the webcam
    // webcam = new tmPose.Webcam(size, size, flip); // width, height, flip
    webcam = new tmPose.Webcam(width, height, flip); // width, height, flip
    await webcam.setup(); // request access to the webcam
    await webcam.play();
    window.requestAnimationFrame(loop);

    ///// TEST EC - fetch webcam //////
    // webcam = document.getElementById("videoElement1")
    //// END TEST //////

    // append/get elements to the DOM
    const canvas = document.getElementById("canvas");
    // const canvas = document.getElementById("videoElement1"); // Change by EC to get the video element instead of canvas element
    // canvas.width = size; 
    // canvas.height = size;
    canvas.width = width; 
    canvas.height = height;
    ctx = canvas.getContext("2d");
    labelContainer = document.getElementById("label-container");

    for (let i = 0; i < maxPredictions; i++) { // and class labels
        labelContainer.appendChild(document.createElement("div"));
    }
}

let btn = document.getElementById("mp-start-btn")
btn.addEventListener("click", init)

async function loop(timestamp) {
    webcam.update(); // update the webcam frame
    await predict();
    window.requestAnimationFrame(loop);
}

async function predict() {
    // Prediction #1: run input through posenet
    // estimatePose can take in an image, video or canvas html element
    const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
    // Prediction 2: run input through teachable machine classification model
    const prediction = await model.predict(posenetOutput);

    for (let i = 0; i < maxPredictions; i++) {
        const classPrediction =
            prediction[i].className + ": " + prediction[i].probability.toFixed(2);
        labelContainer.childNodes[i].innerHTML = classPrediction;

        // EC Addition to send data to backend
        // TODO: only send post back if prob reaches certian threshold and also nto if it's just the base class 
        const classPrediction2 = prediction[i].className;
        console.log("Here is the class prediction:")
        console.log(classPrediction2)
        const request = new XMLHttpRequest()
        request.open('POST', `predictClass/${JSON.stringify(classPrediction2)}`)
        request.send();
        // END Addition

        let isInPose = (prediction[i].className.includes(poseType) && prediction[i].probability > .98)
        armsInAV = isInPose;
        
        // Test to see if I can produce something on front if certian value is true
        if  (isInPose) {
            document.getElementById("test").innerHTML = "It's Arms in a V!";
        }
        
            // document.getElementById("test").innerHTML = classPrediction2;
                // Test to see if I can produce something on front if certian value is true
        if  (prediction[i].className.includes("base") && prediction[i].probability > .98) {
            //document.getElementById("test").innerHTML = "Base Class!!!!";
        }
    }

    // finally draw the poses
    drawPose(pose);
}

function drawPose(pose) {
    if (webcam.canvas) {
        ctx.drawImage(webcam.canvas, 0, 0);
        // draw the keypoints and skeleton
        if (pose) {
            const minPartConfidence = 0.5;
            tmPose.drawKeypoints(pose.keypoints, minPartConfidence, ctx);
            tmPose.drawSkeleton(pose.keypoints, minPartConfidence, ctx);
        }
    }
}