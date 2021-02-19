from flask import Flask, render_template, session, copy_current_request_context
from flask_socketio import SocketIO, emit, disconnect, join_room, leave_room
from threading import Lock

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socket_ = SocketIO(app)
thread = None
thread_lock = Lock()

ROOM = 'room'

@app.route('/')
def index():
    return render_template('index.html')

@socket_.on('join')
async def connect(data sid, environenviron):
    print('Connected', data['username'])
    join_room(ROOM)
    await emit('ready', room=ROOM, skip_sid=sid)
    


@socket_.on('disconnect_request', namespace='/test')
def disconnect(sid):
    sio.leave_room(sid, ROOM)
    print('Disconnected', sid)


@sio.event
async def data(sid, data):
    print('Message from {}: {}'.format(sid, data))
    await sio.emit('data', data, room=ROOM, skip_sid=sid)

if __name__ == '__main__':
    socket_.run(app, debug=True, host='0.0.0.0', port=80)