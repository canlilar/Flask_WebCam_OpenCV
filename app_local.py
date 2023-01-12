from sys import stdout
from flask import Flask, render_template, Response

app = Flask(__name__)
# app.logger.addHandler(logging.StreamHandler(stdout))
app.config['SECRET_KEY'] = 'secret!'
app.config['DEBUG'] = True

@app.route('/')
def index():
    """Video streaming home page."""
    # return render_template('legacy_code/templates/index.html')
    return render_template('full-page-carousel.html')
    # return render_template('legacy_code/templates/media-pipe-test.html')

@app.route('/video_feed')
def video_feed():
    """Video streaming route. Put this in the src attribute of an img tag."""
    return Response(gen(), mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == '__main__':
    app.run()
