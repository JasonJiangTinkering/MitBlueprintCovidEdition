import os
from dotenv import load_dotenv
from flask import Flask, render_template, request, abort
from flask_socketio import SocketIO, emit
from twilio.jwt.access_token import AccessToken
from twilio.jwt.access_token.grants import VideoGrant, ChatGrant
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException
import base64
from PIL import Image
from io import BytesIO
# Set this variable to "threading", "eventlet" or "gevent" to test the
# different async modes, or leave it set to None for the application to choose
# the best option based on installed packages.
async_mode = None

load_dotenv()
twilio_account_sid = "AC574e31283298bd9c08801be42875d2a7"
twilio_api_key_sid = "SKb985afa3d0fbbc7145fad9d41e0ecb74"
twilio_api_key_secret = "cpSrlUkNhEMYQUfFrqLSrAaatMwWFEcI"
twilio_client = Client(twilio_api_key_sid, twilio_api_key_secret,
                       twilio_account_sid)

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, async_mode=async_mode)
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0

@socketio.on('image')
def handle_message(received_data, methods=['GET', 'POST']):
    data = received_data["data"]
    #=== testing input ===
    text_file = open("Output.txt", "w+")
    text_file.write(data)
    text_file.close()
    data = eval(data) 
    x = 0
    for i in data:
        # print("Image" + str(x) + ": " + i)
        throw, throw, i = i.partition(',')
        # data is the base 64 image
        try:
            im = Image.open(BytesIO(base64.b64decode(i)))
        except UnidentifiedImageError:
            print(i)
        im.save('image' + str(x) + '.png', 'PNG')
        x += 1
    emit('my response', {'data': 'got it!'})

def get_chatroom(name):
    for conversation in twilio_client.conversations.conversations.list():
        if conversation.friendly_name == name:
            return conversation

    # a conversation with the given name does not exist ==> create a new one
    return twilio_client.conversations.conversations.create(
        friendly_name=name)


@app.route('/', methods = ["POST", "GET"])
def index():
    if request.method == "POST":
        d = request.form.to_dict()
        username = d['username']
        if username:
            return render_template('call.html', username=username)
        else:
            return redirect('/')
    else:
        return render_template('index.html')

@app.route('/call', methods = ["POST", "GET"])
def call():
    if request.method == 'POST':
        return redirect('/thanks')
    else:
        return redirect('/')

@app.route('/thanks')
def thanks():
    return render_template('thanks.html')


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
    # app.run(host='127.0.0.1')
    socketio.run(app, host='127.0.0.1', port=80)
