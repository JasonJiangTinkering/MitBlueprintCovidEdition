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

// var socket = io.connect('https://' + document.domain + ':' + location.port);
var socket = io();
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

        // send frames of videos on screen over to the server //https://stackoverflow.com/questions/39894777/how-to-have-an-async-endless-loop-with-promises
        promiseLoop();
    });
};
var myerror 
function promiseLoop(){
        // send frames of videos on screen over to the server //https://stackoverflow.com/questions/39894777/how-to-have-an-async-endless-loop-with-promises

    Promise.resolve().then(function resolver() {
        //================================================================
        // teacher = true; // for testing only // get rid of it later
        //================================================================
        console.log("connected: " + connected + "\n teacher: " + teacher);
        return sendPics(connected && teacher)
        .then(resolver);
    }).catch((error) => {
        console.log("Error: " + error);
        myerror = error
    });  
}

const waitforVideo_Students = 5000;
const waitBetweenFrames = 200;
var sendingData;
function sendPics(go){
    return new Promise ((resolve, reject) => {
        console.log("should send? :" + go);
        if (!go){
            //console.log("retrying");
            setTimeout(() => {resolve()}, waitforVideo_Students)
        }
        else{
            setTimeout(() => {
            data = takePics()
            sendingData = data;
            // ======= using sockets =========
            //no students, dont send cheating detector
            if (data.length == 0){setTimeout(() => {resolve()}, waitforVideo_Students)}
            
            else{            
            var x = "["
            for (i of data){
                x += JSON.stringify(i) + ', ';
            }
            x += ']';
            socket.emit('image', {data: x});
            socket.on('my response', function( msg ) {
                if (msg['data'] == 'fail'){
                    reject(); // error has occured
                }
                // set status for each student
                setstatus(msg['data']);
                resolve();
            })}


        }, waitBetweenFrames)} 
    })
};
function setstatus(msg){
    try{
        console.log(msg.length);
        for (i of msg){ //per user  
            labeldivs = document.getElementById("status" + i[0]);//// =========change to SID later
            labeldivs.innerHTML = i.slice(1);
        }
    }
    catch{
        // one of the students could have left, no biggie just finish
        return null;
    }
        
}
// drawing canvas used to extrace frames
var canvas = document.createElement('canvas');
var context = canvas.getContext('2d');
function takePics(i){
    // https://stackoverflow.com/questions/19175174/capture-frames-from-video-with-html5-and-javascript
    //generate pic URL data
    // does not take the teacher's video => assume that because this code
    // is run by teacher, must be the first video
    var list = document.getElementsByTagName("video")
    var names = document.getElementsByClassName("label")
    // list.shift();
    // names.shift();
    var urlLists = [];
    // var i = 1, start at 2nd video
    for (var i=1, max=list.length; i < max; i++) {
        let person = [];
        let w = list[i].videoWidth;
        let h = list[i].videoHeight;
        canvas.width  = w;
        canvas.height = h;
        context.drawImage(list[i], 0, 0, w, h);
        let dataURL = canvas.toDataURL();
        if (dataURL.length <= 10){ //not a valid 64b format
            console.log(dataURL);
            continue;
        }
        person.push(names[i].innerHTML);
        person.push(dataURL);
        urlLists.push(person);
      }
    return urlLists
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
// comment out later
$('#TeacherRestartFrames').hide();
$("#TeacherTestFrames").hide();
function updateParticipantCount() {
    if (!connected)
        count.innerHTML = 'Disconnected.';
    else
        count.innerHTML = (room.participants.size + 1) + ' participants online.';

    if (room.participants.size == 0) 
        {
            // comment out later
            let teacherRestartButton = $('#TeacherRestartFrames')
            teacherRestartButton.show();
            teacherRestartButton.click(promiseLoop)
            let teacherSendOneFrame = $("#TeacherTestFrames")
            teacherSendOneFrame.show();
            teacherSendOneFrame.click(function(){
                console.log(takePics(true));
            })
            teacher = true;
        }

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

    // build status panel for each extra particpant
    let statusPanel = document.createElement('div');
    statusPanel.setAttribute("id", "status" + participant.identity); //// =========change to SID later
    participantDiv.appendChild(statusPanel);


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

addLocalVideo();
connectButtonHandler();
button.addEventListener('click', connectButtonHandler);
shareScreen.addEventListener('click', shareScreenHandler);
toggleChat.addEventListener('click', toggleChatHandler);
chatInput.addEventListener('keyup', onChatInputKey);
