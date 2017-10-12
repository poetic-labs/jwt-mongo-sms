import generateAuthCode from './generateAuthCode';
import upsertAuth from './upsertAuth';

const sendAuthCodeViaSms = async ({
  phoneNumber,
  authCodeLength,
  setMessage,
  getAuthCollection,
  twilioClient,
  twilioPhoneNumber,
}) => {
  const authCode = generateAuthCode(authCodeLength);
  const message = setMessage(authCode);

  await upsertAuth({
    phoneNumber,
    authCode,
    getAuthCollection,
  });

  await twilioClient.messages.create({
    to: phoneNumber,
    body: message,
    from: twilioPhoneNumber,
  });
};

export default sendAuthCodeViaSms;
