import twilio from 'twilio';

const defaultSetCallMessage = code => (
  `Your authentication code is ${code}. Again, your authentication code is ${code}`
);

const getCallHandler = (setCallMessage = defaultSetCallMessage) => (
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

export default getCallHandler;
