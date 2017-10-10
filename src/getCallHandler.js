import twilio from 'twilio';

const defaultSetCallMessage = code => (
  `Your login code is ${code}. Again, your login code is ${code}`
);

const getCallHandler = (setCallMessage = defaultSetCallMessage) => (
  (request, response) => {
    const voiceResponse = new twilio.twiml.VoiceResponse();

    try {
      const { loginCode } = request.query;
      const spacedLoginCode = loginCode.split('').join(' ');

      voiceResponse.say(setCallMessage(spacedLoginCode));
    } catch (error) {
      voiceResponse.hangup();
    }

    response.writeHead(200, { 'Content-Type': 'text/xml' });
    response.end(voiceResponse.toString());
  }
);

export default getCallHandler;
