let APP_ID = "10e3f180593d4ff9a6729fa58cae8df7"

let token = null;
let uid = String(Math.floor(Math.random() * 10000))

let client;
let channel;

let localStream;
let remoteStream;
let peerConnection;

const servers = {
    iceServers:[
        {
            urls:['stun:stun1.l.google.com:19302','stun:stun2.l.google.com:19302']
        }
    ]
}

let init = async ()=>{
    client = await AgoraRTM.createInstance(APP_ID)
    await client.login({uid, token})

    // index.html?room=234234
    channel = client.createChannel('main')
    await channel.join()

    channel.on('MemberJoined', handleUserJoined)

    client.on('MessageFromPeer', handleMessageFromPeer)

    localStream = await navigator.mediaDevices.getUserMedia({video:true, audio:false})
    document.getElementById('user-1').srcObject = localStream

}

let handleMessageFromPeer = async (message, MemberID) => {
    message = JSON.parse(message.text)
    console.log('Message:', message)
}

let handleUserJoined = async (MemberID) => {
    console.log('A new user joined the channel;', MemberID)
    createOffer(MemberID)
}

let createOffer = async (MemberID)=> {
    peerConnection = new RTCPeerConnection(servers)

    remoteStream = new MediaStream()
    document.getElementById('user-2').srcObject = remoteStream

    if(!localStream){
        localStream = await navigator.mediaDevices.getUserMedia({video:true, audio:false})
        document.getElementById('user-1').srcObject = localStream
    }

    localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream)
    })

    peerConnection.ontrack = (event) => {
        event.streams[0].getTracks().forEach((track) => {
            remoteStream.addTrack(track)
        })
    }

    peerConnection.onicecandidate = async (event) => {
        if(event.candidate){
            // console.log('New ICE Candidate:', event.candidate)
            client.sendMessageToPeer({text:JSON.stringify({'type':'candidate', 'candidate':offer})}, MemberID)
        }
    }

    let offer = await peerConnection.createOffer()
    await peerConnection.setLocalDescription(offer)

    // console.log('offer:', offer)
    client.sendMessageToPeer({text:JSON.stringify({'type':'offer', 'offer':offer})}, MemberID)
}

init()