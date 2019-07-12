const CAST_MESSAGE_NAMESPACE = 'urn:x-cast:fm.generative';

const { cast } = window;

const castContext = cast.framework.CastReceiverContext.getInstance();
const playerManager = castContext.getPlayerManager();

const pc = new RTCPeerConnection(null);

const mediaInfo = Object.assign(
  new cast.framework.messages.MediaInformation(),
  {
    metadata: Object.assign(
      new cast.framework.messages.MusicTrackMediaMetadata(),
      {
        albumName: 'Generative.fm',
        title: '',
        artist: 'Alex Bainter',
      }
    ),
    contentType: 'audio',
    streamType: cast.framework.messages.StreamType.STREAM,
  }
);

pc.ontrack = event => {
  console.log('track received');
  mediaInfo.contentUrl = window.URL.createObjectURL(event.streams[0]);
  playerManager.load({
    media: mediaInfo,
  });
  //playerManager.setMediaInformation(mediaInfo);
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
    castContext.sendCustomMessage(CAST_MESSAGE_NAMESPACE, castSenderId, {
      type: 'ice_candidate',
      candidate,
    });
  }
};

castContext.addCustomMessageListener(CAST_MESSAGE_NAMESPACE, event => {
  const { data, senderId } = event;
  pc.onicecandidate = makeHandleIceCandidate(senderId);
  switch (data.type) {
    case 'offer': {
      return handleOfferReceived(senderId, data);
    }
    case 'ice_candidate': {
      return pc.addIceCandidate(data.candidate);
    }
    case 'metadata': {
      const { title, imageUrl } = data;
      console.log('updating metadata');
      Object.assign(mediaInfo.metadata, {
        title,
        images: [new cast.framework.messages.Image(imageUrl)],
      });
      return playerManager.setMediaInformation(mediaInfo);
    }
    default: {
      //nothing
    }
  }
});

castContext.start();
