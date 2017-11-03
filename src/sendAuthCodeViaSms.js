import generateAuthCode from './generateAuthCode';
import upsertAuth from './upsertAuth';

const sendAuthCodeViaSms = async ({
  authCodeLength,
  getAuthCollection,
  isWhitelisted,
  phoneNumber,
  setMessage,
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

  if (!isWhitelisted) {
    await twilioClient.messages.create({
      to: phoneNumber,
      body: message,
      from: twilioPhoneNumber,
    });
  }

  return true;
};

export default sendAuthCodeViaSms;
