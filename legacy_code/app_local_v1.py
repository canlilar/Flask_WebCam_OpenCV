from sys import stdout
from makeup_artist import Makeup_artist
import logging
from flask import Flask, render_template, Response
from flask_socketio import SocketIO, emit
from camera import Camera
from utils import base64_to_pil_image, pil_image_to_base64
import cv2
import numpy as np
import base64
import io
from imageio import imread
# import matplotlib.pyplot as plt
#Testing
import matplotlib
matplotlib.use('agg')
import matplotlib.pyplot as plt
import os

app = Flask(__name__)
app.logger.addHandler(logging.StreamHandler(stdout))
app.config['SECRET_KEY'] = 'secret!'
app.config['DEBUG'] = True
##### EC Change 7/19/2022 - Security update ########
# socketio = SocketIO(app)
socketio = SocketIO(app,cors_allowed_origins="*") #not working to supress 400 error
#######################
camera = Camera(Makeup_artist())


@socketio.on('input image', namespace='/test')
def test_message(input):
    input = input.split(",")[1]
    camera.enqueue_input(input)
    image_data = input # Do your magical Image processing here!!
    #image_data = image_data.decode("utf-8")

    img = imread(io.BytesIO(base64.b64decode(image_data)))
    cv2_img = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
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
    # return render_template('media-pipe-test.html')

# Get predictions from teachable machine using POST method
@app.route('/predictClass/<string:classPrediction2>', methods=['POST'])
def predictClass(classPrediction2):
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
    return('/')
############### END EC 18AUG22 Change ################


def gen():
    """Video streaming generator function."""

    app.logger.info("starting to generate frames!")
    while True:
        frame = camera.get_frame() #pil_image_to_base64(camera.get_frame())

        print(type(frame))
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')


@app.route('/video_feed')
def video_feed():
    """Video streaming route. Put this in the src attribute of an img tag."""
    return Response(gen(), mimetype='multipart/x-mixed-replace; boundary=frame')


if __name__ == '__main__':
    socketio.run(app)
    # app.run(debug=True, host="0.0.0.0", ssl_context=('cert.pem', 'key.pem'),port=int(os.environ.get("PORT", 8080)))
    # app.run(debug=True, host="0.0.0.0",port=int(os.environ.get("PORT", 8080)))
