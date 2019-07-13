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
        title: 'Select a piece',
      }
    ),
    contentType: 'audio',
    streamType: cast.framework.messages.StreamType.LIVE,
  }
);

pc.ontrack = event => {
  console.log('track received');
  const [stream] = event.streams;
  // TODO: Update this when the cast framework plays nicely with srcObject
  try {
    // This was deprecated but is less gross
    mediaInfo.contentUrl = window.URL.createObjectURL(stream);
    console.log('using non-gross deprecated source');
  } catch (e) {
    // This is not deprecated but is more gross
    console.log('using gross source');
    const audioEl = document.createElement('audio');
    audioEl.srcObject = stream;
    audioEl.muted = true;
    const mediaRecorder = new MediaRecorder(stream);
    const mediaSource = new MediaSource();
    mediaInfo.contentUrl = window.URL.createObjectURL(mediaSource);
    mediaSource.addEventListener('sourceopen', () => {
      console.log('source open');
      const sourceBuffer = mediaSource.addSourceBuffer(mediaRecorder.mimeType);
      mediaRecorder.ondataavailable = event => {
        const fileReader = new FileReader();
        fileReader.onload = () => {
          sourceBuffer.appendBuffer(fileReader.result);
        };
        fileReader.readAsArrayBuffer(event.data);
      };
      mediaRecorder.start(1000);
    });
  }

  playerManager.load({
    media: mediaInfo,
  });
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
      handleOfferReceived(senderId, data);
      break;
    }
    case 'ice_candidate': {
      pc.addIceCandidate(data.candidate);
      break;
    }
    case 'metadata': {
      const { title, imageUrl, releaseDate, artist } = data;
      console.log('updating metadata');
      Object.assign(mediaInfo.metadata, {
        title,
        releaseDate,
        artist,
        images: [new cast.framework.messages.Image(imageUrl)],
      });
      playerManager.setMediaInformation(mediaInfo);
      break;
    }
    default: {
      //nothing
    }
  }
});

castContext.start();
