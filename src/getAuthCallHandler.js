import twilio from 'twilio';

const defaultVoiceResponseHandler = (voiceResponse, authCode) => {
  const message = `Your authentication code is ${authCode}. Again, your authentication code is ${authCode}`;

  voiceResponse.say(message);
};

const getAuthCallHandler = (handleVoiceResponse = defaultVoiceResponseHandler) => (
  (request, response) => {
    const voiceResponse = new twilio.twiml.VoiceResponse();

    try {
      const { authCode } = request.query;
      const spacedAuthCode = authCode.split('').join(' ');

      handleVoiceResponse(voiceResponse, spacedAuthCode);
    } catch (error) {
      voiceResponse.hangup();
    }

    response.writeHead(200, { 'Content-Type': 'text/xml' });
    response.end(voiceResponse.toString());
  }
);

export default getAuthCallHandler;
