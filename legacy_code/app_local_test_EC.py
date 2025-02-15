from sys import stdout
from makeup_artist import Makeup_artist
import logging
from flask import Flask, render_template, Response, request, redirect
from flask_socketio import SocketIO, emit
from camera import Camera
from utils import base64_to_pil_image, pil_image_to_base64
import cv2
import numpy as np
import base64
import io
from imageio import imread
# import matplotlib.pyplot as plt
import matplotlib
matplotlib.use('agg')
import matplotlib.pyplot as plt
import os
#### EC Change 19AUG22 to resolve the ValueError('Too many packets in payload') ####
from engineio.payload import Payload
Payload.max_decode_packets = 500
#############

app = Flask(__name__)
app.logger.addHandler(logging.StreamHandler(stdout))
app.config['SECRET_KEY'] = 'secret!'
app.config['DEBUG'] = True
##### EC Change 7/19/2022 - Security update ########
# socketio = SocketIO(app)
socketio = SocketIO(app,cors_allowed_origins="*")
#######################
camera = Camera(Makeup_artist())

# def faceMask(image):
#     '''
#     Function to take it the image from the webam and add a facemask based on their hand signals
#     '''
#     input_img = image
#     image_w_mask = input_img #TODO: insert media pipe code here

#     return image, image_w_mask

@socketio.on('input image', namespace='/test')
def test_message(input):
    input = input.split(",")[1]
    camera.enqueue_input(input)
    image_data = input # Do your magical Image processing here!!
    #image_data = image_data.decode("utf-8")

    img = imread(io.BytesIO(base64.b64decode(image_data)))
    ########### Change by EC #############
    # cv2_img = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
    cv2_img = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
    # cv2_img, _ = faceMask(image=cv2_img)
    ############################################    
    cv2.imwrite("reconstructed.jpg", cv2_img)
    retval, buffer = cv2.imencode('.jpg', cv2_img)
    b = base64.b64encode(buffer)
    b = b.decode()
    image_data = "data:image/jpeg;base64," + b

    # print("OUTPUT " + image_data)
    print("We got the image!")
    emit('out-image-event', {'image_data': image_data}, namespace='/test')
    #camera.enqueue_input(base64_to_pil_image(input))


@socketio.on('connect', namespace='/test')
def test_connect():
    app.logger.info("client connected")
    print("client connected: test")


############# EC change 18AUG22: integration of teachable machine with main page ########
# @app.route('/')
# def index():
#     """Video streaming home page."""
#     # return render_template('index.html')
#     return render_template('full-page-carousel.html')

@app.route('/')
def index():
    """Video streaming home page."""
    # return render_template('index.html')
    return render_template('full-page-carousel.html')
    # return render_template('full-page-carousel-legacy-1.html')

########## TESTING #############
@app.route('/media-pipe-test')
def faskMaskPage():
    """TESTing facemask page from Youtube video"""
    return render_template('media-pipe-test.html')
###############################

# Get predictions from teachable machine using POST method
# @app.route('/predictClass/<string:classPrediction2>', methods=['POST'])
# def predictClass(classPrediction2):
#     """Teachable Machine model test"""
#     # print("The prediction is: ..................") # This print function works
#     classPrediction2=str(classPrediction2).replace('"', '') # strip out the quote marks
#     # print(classPrediction2) # See what it is
#     # if classPrediction2=="armsInVshape":
#         # TODO
#         # print("Do something like change the background")
#     # elif classPrediction2=="baseClass":
#     #     print("Base Class: do nothing")
#     # return render_template('index.html')
#     # return render_template('teachable-machine-test.html')
#     return('/')
############### END EC 18AUG22 Change ################


def gen():
    """Video streaming generator function."""

    app.logger.info("starting to generate frames!")
    while True:
        frame = camera.get_frame() #pil_image_to_base64(camera.get_frame())

        # EC TEST to get a fram and save it ####
        img = imread(io.BytesIO(base64.b64decode(frame)))
        cv2_img = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
        # cv2_img, _ = faceMask(image=cv2_img)
        cv2.imwrite("reconstructed2.jpg", cv2_img)
        print("I got the frame")
        # ################         

        print("Frame type!!!!!:",type(frame))
        ###### Test my EC ##############
        # yield (b'--frame\r\n'
        #        b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
        yield (b'--cv2_img\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
        #################################

@app.route('/video_feed')
def video_feed():
    """Video streaming route. Put this in the src attribute of an img tag."""
    return Response(gen(), mimetype='multipart/x-mixed-replace; boundary=frame')

########## EC additional page for testing #############
@app.route('/teachable-machine')
def teachableMachine():
    """Teachable Machine model test"""
    # return render_template('index.html')
    return render_template('teachable-machine-test.html')

@app.route('/predictClass2/<string:classPrediction2>', methods=['POST'])
def predictClass2(classPrediction2):
    """Teachable Machine model test"""
    # print("The prediction is: ..................") # This print function works
    classPrediction2=str(classPrediction2).replace('"', '') # strip out the quote marks
    # print(classPrediction2) # See what it is
    # if classPrediction2=="armsInVshape":
        # TODO
        # print("Do something like change the background")
    # elif classPrediction2=="baseClass":
    #     print("Base Class: do nothing")
    # return render_template('index.html')
    # return render_template('teachable-machine-test.html')
    return('/teachable-machine')
######################################################


if __name__ == '__main__':
    socketio.run(app)
    # app.run(debug=True, host="0.0.0.0", ssl_context=('cert.pem', 'key.pem'),port=int(os.environ.get("PORT", 8080)))
    # app.run(ssl_context=('cert.pem', 'key.pem'))
