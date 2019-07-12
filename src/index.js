const CAST_MESSAGE_NAMESPACE = 'urn:x-cast:fm.generative';
const audioEl = document.getElementById('audio-destination');

const { cast } = window;

const castContext = cast.framework.CastReceiverContext.getInstance();
const playerManager = castContext.getPlayerManager();

const pc = new RTCPeerConnection(null);

pc.ontrack = event => {
  console.log('track received');
  audioEl.srcObject = event.streams[0];
  audioEl.play();
};

const handleOfferReceived = (castSenderId, offer) => {
  console.log('offer received');
  pc.setRemoteDescription(offer);
  pc.createAnswer().then(answer => {
    pc.setLocalDescription(answer);
    castContext.sendCustomMessage(CAST_MESSAGE_NAMESPACE, castSenderId, answer);
  });
};

const makeHandleIceCandidate = castSenderId => ({ candidate }) => {
  if (candidate !== null) {
    castContext.sendCustomMessage(
      CAST_MESSAGE_NAMESPACE,
      castSenderId,
      candidate
    );
  }
};

castContext.addCustomMessageListener(CAST_MESSAGE_NAMESPACE, event => {
  const { data, senderId } = event;
  pc.onicecandidate = makeHandleIceCandidate(senderId);
  if (data.type === 'offer') {
    handleOfferReceived(senderId, data);
  } else {
    pc.addIceCandidate(data);
  }
});

castContext.start();
console.log(castContext.getDeviceCapabilities());
