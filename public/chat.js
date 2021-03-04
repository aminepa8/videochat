var socket = io.connect("https://35.225.119.123:4000");

var divVideoChatLobby = document.getElementById("video-chat-lobby");
var divVideoChat = document.getElementById("video-chat-room");
var joinButton = document.getElementById("join");
var userVideo = document.getElementById("user-video");
var peerVideo = document.getElementById("peer-video");
var roomInput = document.getElementById("roomName");
var roomName = roomInput.value;
var creator = false;
var rtcPeerConnection;
var userStream;
var iceServers = {
    iceServers:[
        {urls : "stun:stun.services.mozilla.com"},
        {urls : "stun:stun1.l.google.com:19302"},

        
        {
            urls: 'turn:35.223.204.39:3478',
            credential: 'xvk98A',
            username: 'user99'
        },

        
    ],
};
joinButton.addEventListener("click", function () {
  if (roomInput.value == "") {
    alert("Please enter a room name");
  } else {
    socket.emit("join",roomName);
  }
});


socket.on("created",function() {
    creator = true;
    navigator.mediaDevices
      .getUserMedia({audio:true,video : true,})
      .then(function (stream) {
        userStream = stream;
          divVideoChatLobby.style= "display:none";
        userVideo.srcObject = stream;
        userVideo.onloadedmetadata = function(e) {
            userVideo.play();
        };
      })
      .catch(function (err) {
        /* handle the error */
        alert("Couldn't access User Media");
      });

});

socket.on("joined",function() {
    creator = false;
    navigator.mediaDevices
      .getUserMedia({audio:true,video : true,})
      .then(function (stream) {
        userStream = stream;
          divVideoChatLobby.style= "display:none";
        userVideo.srcObject = stream;
        userVideo.onloadedmetadata = function(e) {
            userVideo.play();
        };
        socket.emit("ready",roomName);
      })
      .catch(function (err) {
        /* handle the error */
        alert("Couldn't access User Media");
      });
});

socket.on("full",function() {
    alert("Room is full , can't joined");
});


socket.on("ready",function() {
    if (creator) {
        rtcPeerConnection = new RTCPeerConnection(iceServers);
        rtcPeerConnection.onicecandidate = OnIceCandidateFunction;
        rtcPeerConnection.ontrack = OnTrackFunction;
        rtcPeerConnection.addTrack(userStream.getTracks()[0],userStream); //videoTrack
        rtcPeerConnection.addTrack(userStream.getTracks()[1],userStream);//audioTrack
        rtcPeerConnection.createOffer(function(offer){
            rtcPeerConnection.setLocalDescription(offer); 
            console.log("Offer " +offer);
            socket.emit("offer",offer,roomName);
        },function(error) {
            console.log(error);
        });
    }
});



socket.on("candidate",function(candidate) {
    var iceCandidate = new RTCIceCandidate(
        {
        candidate:candidate.candidate,
        sdpMid:candidate.sdpMid,
        sdpMLineIndex: candidate.sdpMLineIndex,
        }
    );
    rtcPeerConnection.addIceCandidate(iceCandidate);
});



socket.on("offer",function(offer) {
    if (!creator) {
        rtcPeerConnection = new RTCPeerConnection(iceServers);
        rtcPeerConnection.onicecandidate = OnIceCandidateFunction;
        rtcPeerConnection.ontrack = OnTrackFunction;
        rtcPeerConnection.addTrack(userStream.getTracks()[0],userStream); //videoTrack
        rtcPeerConnection.addTrack(userStream.getTracks()[1],userStream);//audioTrack
        rtcPeerConnection.setRemoteDescription(offer);
        rtcPeerConnection.createAnswer(
            function(answer){
                rtcPeerConnection.setLocalDescription(answer);     
                socket.emit("answer",answer,roomName);
            },
        function(error) {
            console.log(error);
        });
    }
});

socket.on("answer",function(answer) {
    rtcPeerConnection.setRemoteDescription(answer);
    
});


function OnIceCandidateFunction(event) {
    if (event.candidate) {
        socket.emit("candidate",event.candidate,roomName);
    }
}

function OnTrackFunction(event) {
    peerVideo.srcObject = event.streams[0];
    peerVideo.onloadedmetadata = function(e) {
        peerVideo.play();
    };
}