import twilio from 'twilio';

const defaultSetCallMessage = authCode => (
  `Your authentication code is ${authCode}. Again, your authentication code is ${authCode}`
);

const getAuthCallHandler = (setCallMessage = defaultSetCallMessage) => (
  (request, response) => {
    const voiceResponse = new twilio.twiml.VoiceResponse();

    try {
      const { authCode } = request.query;
      const spacedAuthCode = authCode.split('').join(' ');

      voiceResponse.say(setCallMessage(spacedAuthCode));
    } catch (error) {
      voiceResponse.hangup();
    }

    response.writeHead(200, { 'Content-Type': 'text/xml' });
    response.end(voiceResponse.toString());
  }
);

export default getAuthCallHandler;