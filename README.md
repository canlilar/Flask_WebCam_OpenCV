
### To deploy locally
```
conda create -n flask-webcam-opencv-env python=2.7.11
conda activate flask-webcam-opencv-env
pip install -r requirements.txt
pip install pyopenssl
openssl req -x509 -newkey rsa:4096 -nodes -out cert.pem -keyout key.pem -days 365
```
The securtiy certificate you created above may take some time to be validated by a third party. 
Wait a day or two then try to launch the app like this:
```
python app_local.py
```
You'll then be able to access the app here: https://0.0.0.0:8080/
**Trouble shooting:**
- if you recieve the error:
```
socket.error: [Errno 48] Address already in use
```
then see the solution here: https://stackoverflow.com/questions/19071512/socket-error-errno-48-address-already-in-use



### To deploy on GCP using Cloud Run:
You need a GCP account and a project to be able to do this. You can use the free tier version.

```
gcloud run deploy
```

**Resources and credits:**
- Security running locally: https://blog.miguelgrinberg.com/post/running-your-flask-application-over-https
