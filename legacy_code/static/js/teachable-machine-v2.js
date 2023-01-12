// More API functions here:
// https://github.com/googlecreativelab/teachablemachine-community/tree/master/libraries/pose

//import dependencies
import * as mediapipe from "./media-pipe" 

// the link to your model provided by Teachable Machine export panel
const URL = "https://teachablemachine.withgoogle.com/models/CvlC5wCam/"; //"./my_model/";
let model, webcam, ctx, labelContainer, maxPredictions;

async function init() {
// async function init() {
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

        // produce something on front if certian value is true
        if  (prediction[i].className.includes("arms") && prediction[i].probability > .98) {
            document.getElementById("test").innerHTML = "It's Arms in a V!"; //this is just for testing
            // mediapipe.faceMesh.onResults(onResults);
        }
            // document.getElementById("test").innerHTML = classPrediction2;
                // Test to see if I can produce something on front if certian value is true
        if  (prediction[i].className.includes("base") && prediction[i].probability > .98) {
            document.getElementById("test").innerHTML = "Base Class!!!!";
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

// export {init, drawPose}; // a list of exported variables