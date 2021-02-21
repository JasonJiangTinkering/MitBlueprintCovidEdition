const root = document.getElementById('root');
const usernameInput = document.getElementById('username');
const button = document.getElementById('join_leave')
const shareScreen = document.getElementById('share_screen');
const toggleChat = document.getElementById('toggle_chat');
const container = document.getElementById('container');
const count = document.getElementById('count');
const chatScroll = document.getElementById('chat-scroll');
const chatContent = document.getElementById('chat-content');
const chatInput = document.getElementById('chat-input');
let connected = false;
let teacher = false;
let room;
let chat;
let conv;
let screenTrack;

var socket = io.connect('http://' + document.domain + ':' + location.port);
socket.on('connect', function() {
    socket.emit( 'my event', {
        data: 'User Connected'
      } )
    })



function addLocalVideo() {
    Twilio.Video.createLocalVideoTrack().then(track => {
        let video = document.getElementById('local').firstChild;
        let trackElement = track.attach();
        trackElement.addEventListener('click', () => { zoomTrack(trackElement); });
        // event listeners to capture frames every interval from the user's video feed

        video.appendChild(trackElement);

        // send frames of videos on screen over to the server
        Promise.resolve().then(function resolver() {
            console.log("connected: " + connected + "\n teacher: " + teacher);
            return sendPics(connected && teacher)
            .then(resolver);
        }).catch((error) => {
            console.log("Error: " + error);
        });


    });
};



function sendPics(go){
    return new Promise ((resolve, reject) => {
        console.log("should send? :" + go);
        if (!go){
            //console.log("retrying");
            setTimeout(() => {resolve()}, 5000)
            // set a 1 sec timer before testing if video works again

        }
        else{
            setTimeout(() => {
            //console.log("sending");
            data = takePics()
            //  ====== using post request  ======
            // var formData = new FormData();

            // formData.append("data", JSON.stringify(data));
            // var xhr = new XMLHttpRequest();
            // xhr.open("POST", '/', true);
            // xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            // xhr.onload = function(){
            //     if (xhr.status === 200){
            //         // alert('Good')
            //         console.log("socket sent");
            //         resolve();
            //     }
            //     else {
            //         alert('Request failed')
            //     }
            // };
            // xhr.send(formData)
            // ======= using sockets =========

            socket.emit('image', {data: JSON.stringify(data)});
            socket.on( 'my response', function( msg ) {
                console.log( msg );
                // set status for each student
                setstatus(msg);
                resolve();
            })

        }, 200)} // time until get next frame
    })
};
// function setstatus(msg){
//     for (i of msg){ //per user

//         for(x of i){

//         }
//     }
// }
function takePics(i){
    // https://stackoverflow.com/questions/19175174/capture-frames-from-video-with-html5-and-javascript
    //generate pic URL data

    var list = document.getElementsByTagName("video")
    var names = document.getElementsByClassName("label")
    var urlLists = [];
    for (var i=0, max=list.length; i < max; i++) {
        var person = [];
        w = list[i].videoWidth;
        h = list[i].videoHeight;
        var canvas = document.createElement('canvas');
        canvas.width  = w;
        canvas.height = h;
        var context = canvas.getContext('2d');
        context.drawImage(list[i], 0, 0, w, h);
        var dataURL = canvas.toDataURL();
        // console.log(dataURL);

        person.push(names[i].innerHTML);
        person.push(dataURL);
        urlLists.push(person);
      }
    return urlLists
    // fix + test parameters later =============================================

    //create img
    // var img = document.createElement('img');
    // img.setAttribute('src', dataURL);


}
function connectButtonHandler(event) {
    event.preventDefault();
}
function connectButtonHandler(){
    if (!connected) {
        let username = usernameInput.innerHTML;
        connect(username).then(() => {
            shareScreen.disabled = false;
        }).catch(() => {
            alert('Connection failed. Is the backend running?');
        });
    }
    else {
        disconnect();
        connected = false;
        shareScreen.innerHTML = 'Share screen';
        shareScreen.disabled = true;
    }
};

function connect(username) {
    let promise = new Promise((resolve, reject) => {
        // get a token from the back end
        let data;
        fetch('/login', {
            method: 'POST',
            body: JSON.stringify({'username': username})
        }).then(res => res.json()).then(_data => {
            // join video call
            data = _data;
            return Twilio.Video.connect(data.token);
        }).then(_room => {
            room = _room;
            room.participants.forEach(participantConnected);
            room.on('participantConnected', participantConnected);
            room.on('participantDisconnected', participantDisconnected);
            connected = true;
            updateParticipantCount();
            connectChat(data.token, data.conversation_sid);
            resolve();
        }).catch(e => {
            console.log(e);
            reject();
        });
    });
    return promise;
};

function updateParticipantCount() {
    if (!connected)
        count.innerHTML = 'Disconnected.';
    else
        count.innerHTML = (room.participants.size + 1) + ' participants online.';

    if (room.participants.size == 0) teacher = true;
};

function participantConnected(participant) {
    let participantDiv = document.createElement('div');
    participantDiv.setAttribute('id', participant.sid);
    participantDiv.setAttribute('class', 'participant');

    let tracksDiv = document.createElement('div');
    participantDiv.appendChild(tracksDiv);

    let labelDiv = document.createElement('div');
    labelDiv.setAttribute('class', 'label');
    labelDiv.innerHTML = participant.identity;
    participantDiv.appendChild(labelDiv);

    container.appendChild(participantDiv);

    participant.tracks.forEach(publication => {
        if (publication.isSubscribed)
            trackSubscribed(tracksDiv, publication.track);
    });
    participant.on('trackSubscribed', track => trackSubscribed(tracksDiv, track));
    participant.on('trackUnsubscribed', trackUnsubscribed);

    updateParticipantCount();
};

function participantDisconnected(participant) {
    document.getElementById(participant.sid).remove();
    updateParticipantCount();
};

function trackSubscribed(div, track) {
    let trackElement = track.attach();
    trackElement.addEventListener('click', () => { zoomTrack(trackElement); });
    div.appendChild(trackElement);
};

function trackUnsubscribed(track) {
    track.detach().forEach(element => {
        if (element.classList.contains('participantZoomed')) {
            zoomTrack(element);
        }
        element.remove()
    });
};

function disconnect() {
    room.disconnect();
    if (chat) {
        chat.shutdown().then(() => {
            conv = null;
            chat = null;
        });
    }
    while (container.lastChild.id != 'local')
        container.removeChild(container.lastChild);
    button.innerHTML = 'Join call';
    if (root.classList.contains('withChat')) {
        root.classList.remove('withChat');
    }
    toggleChat.disabled = true;
    connected = false;
    updateParticipantCount();
};

function shareScreenHandler() {
    event.preventDefault();
    if (!screenTrack) {
        navigator.mediaDevices.getDisplayMedia().then(stream => {
            screenTrack = new Twilio.Video.LocalVideoTrack(stream.getTracks()[0]);
            room.localParticipant.publishTrack(screenTrack);
            screenTrack.mediaStreamTrack.onended = () => { shareScreenHandler() };
            console.log(screenTrack);
            shareScreen.innerHTML = 'Stop sharing';
        }).catch(() => {
            alert('Could not share the screen.')
        });
    }
    else {
        room.localParticipant.unpublishTrack(screenTrack);
        screenTrack.stop();
        screenTrack = null;
        shareScreen.innerHTML = 'Share screen';
    }
};

function zoomTrack(trackElement) {
    if (!trackElement.classList.contains('trackZoomed')) {
        // zoom in
        container.childNodes.forEach(participant => {
            if (participant.classList && participant.classList.contains('participant')) {
                let zoomed = false;
                participant.childNodes[0].childNodes.forEach(track => {
                    if (track === trackElement) {
                        track.classList.add('trackZoomed')
                        zoomed = true;
                    }
                });
                if (zoomed) {
                    participant.classList.add('participantZoomed');
                }
                else {
                    participant.classList.add('participantHidden');
                }
            }
        });
    }
    else {
        // zoom out
        container.childNodes.forEach(participant => {
            if (participant.classList && participant.classList.contains('participant')) {
                participant.childNodes[0].childNodes.forEach(track => {
                    if (track === trackElement) {
                        track.classList.remove('trackZoomed');
                    }
                });
                participant.classList.remove('participantZoomed')
                participant.classList.remove('participantHidden')
            }
        });
    }
};

function connectChat(token, conversationSid) {
    return Twilio.Conversations.Client.create(token).then(_chat => {
        chat = _chat;
        return chat.getConversationBySid(conversationSid).then((_conv) => {
            conv = _conv;
            conv.on('messageAdded', (message) => {
                addMessageToChat(message.author, message.body);
            });
            return conv.getMessages().then((messages) => {
                chatContent.innerHTML = '';
                for (let i = 0; i < messages.items.length; i++) {
                    addMessageToChat(messages.items[i].author, messages.items[i].body);
                }
                toggleChat.disabled = false;
            });
        });
    }).catch(e => {
        console.log(e);
    });
};

function addMessageToChat(user, message) {
    chatContent.innerHTML += `<p><b>${user}</b>: ${message}`;
    chatScroll.scrollTop = chatScroll.scrollHeight;
}

function toggleChatHandler() {
    event.preventDefault();
    if (root.classList.contains('withChat')) {
        root.classList.remove('withChat');
    }
    else {
        root.classList.add('withChat');
        chatScroll.scrollTop = chatScroll.scrollHeight;
    }
};

function onChatInputKey(ev) {
    if (ev.keyCode == 13) {
        conv.sendMessage(chatInput.value);
        chatInput.value = '';
    }
};
const togglexmute = document.getElementById('toggle-mute');
// mute


togglexmute.addEventListener('click', (event) => {
    if (event.target.getAttribute('_go') == 't'){
        event.target.setAttribute('_go', 'f');
        event.target.innerHTML = 'Unmute';
        room.localParticipant.audioTracks.forEach(track => {
            track.track.disable();
          });
    }
    else{
        event.target.setAttribute('_go', 't');
        event.target.innerHTML = 'Mute';
        room.localParticipant.audioTracks.forEach(track => {
            track.track.enable();
          });
    }
})

const videoParent = document.getElementById('local');
const videoCover = document.getElementById('coverDiv');
function setUpCover(){
    videoCover.width = videoParent.width
    videoCover.height = videoParent.height
}
const togglexvideo = document.getElementById('toggle-video');
togglexvideo.addEventListener('click', (event) => {
    if (event.target.getAttribute('_go') == 't'){
        event.target.setAttribute('_go', 'f');

        event.target.innerHTML = 'Start Video';
        room.localParticipant.videoTracks.forEach(track => {
            track.track.disable();
          });
    }
    else{
        event.target.setAttribute('_go', 't');
        event.target.innerHTML = 'Stop Video';
        room.localParticipant.videoTracks.forEach(track => {
            track.track.enable();
          });
    }
})

addLocalVideo();
connectButtonHandler();
button.addEventListener('click', connectButtonHandler);
shareScreen.addEventListener('click', shareScreenHandler);
toggleChat.addEventListener('click', toggleChatHandler);
chatInput.addEventListener('keyup', onChatInputKey);
