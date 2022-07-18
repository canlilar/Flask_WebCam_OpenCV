FROM python:2.7.11
# RUN apt-get update -y --fix-missing --allow-releaseinfo-change
# RUN DEBIAN_FRONTEND=noninteractive apt-get install -y python3.6 python3-pip python3-pip python-dev build-essential libgl1-mesa-glx libsm6 libxext6 libglib2.0-0
RUN mkdir /app
WORKDIR /app
COPY . /app/

RUN wget https://bootstrap.pypa.io/pip/2.7/get-pip.py
RUN python2 get-pip.py
RUN pip2 install --upgrade setuptools==44.1.1
# RUN pip2 install --upgrade setuptools
# RUN apt-get install python3-tk
# RUN pip2 install --upgrade pip
# RUN apt-get install cmake -y
# RUN pip2 install setuptools
# RUN pip install pip==9.0.3
# RUN pip install flask
RUN pip2 install -r requirements.txt
CMD ["python", "app.py"]