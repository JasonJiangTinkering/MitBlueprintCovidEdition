import os
import cv2
import threading
import pickle
import socket
import struct
from dotenv import load_dotenv
from flask import Flask, render_template, request, abort
from twilio.jwt.access_token import AccessToken
from twilio.jwt.access_token.grants import VideoGrant, ChatGrant
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException

load_dotenv()
twilio_account_sid = "AC574e31283298bd9c08801be42875d2a7"
twilio_api_key_sid = "SKb985afa3d0fbbc7145fad9d41e0ecb74"
twilio_api_key_secret = "cpSrlUkNhEMYQUfFrqLSrAaatMwWFEcI"
twilio_client = Client(twilio_api_key_sid, twilio_api_key_secret,
                       twilio_account_sid)

app = Flask(__name__)

class Thread (threading.Thread):
   def __init__(self):
      threading.Thread.__init__(self)
   def run(self):
      stream_cam()


def stream_cam():
    cap = cv2.VideoCapture(0)
    clientsocket=socket.socket(socket.AF_INET,socket.SOCK_STREAM)
    clientsocket.connect(('localhost',8089))

    while(True):
        ret,frame=cap.read()
        # Serialize frame
        data = pickle.dumps(frame)

        # Send message length first
        message_size = struct.pack("L", len(data)) ### CHANGED

        # Then data
        clientsocket.sendall(message_size + data)

    # When everything done, release the capture
    cap.release()
    cv2.destroyAllWindows()



def get_chatroom(name):
    for conversation in twilio_client.conversations.conversations.list():
        if conversation.friendly_name == name:
            return conversation

    # a conversation with the given name does not exist ==> create a new one
    return twilio_client.conversations.conversations.create(
        friendly_name=name)


@app.route('/')
def index():
    t = Thread()
    t.start()
    return render_template('index.html')


@app.route('/login', methods=['POST'])
def login():
    username = request.get_json(force=True).get('username')
    if not username:
        abort(401)

    conversation = get_chatroom('My Room')
    try:
        conversation.participants.create(identity=username)
    except TwilioRestException as exc:
        # do not error if the user is already in the conversation
        if exc.status != 409:
            raise

    token = AccessToken(twilio_account_sid, twilio_api_key_sid,
                        twilio_api_key_secret, identity=username)
    token.add_grant(VideoGrant(room='My Room'))
    token.add_grant(ChatGrant(service_sid=conversation.chat_service_sid))

    return {'token': token.to_jwt().decode(),
            'conversation_sid': conversation.sid}


if __name__ == '__main__':
    app.run(host='127.0.0.1')
