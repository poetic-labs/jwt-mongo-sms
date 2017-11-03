import generateAuthCode from './generateAuthCode';
import upsertAuth from './upsertAuth';

const sendAuthCodeViaCall = async ({
  authCodeLength,
  callUrl,
  getAuthCollection,
  isWhitelisted,
  phoneNumber,
  twilioClient,
  twilioPhoneNumber,
}) => {
  const authCode = generateAuthCode(authCodeLength);

  await upsertAuth({
    phoneNumber,
    authCode,
    getAuthCollection,
  });

  if (!isWhitelisted) {
    await twilioClient.calls.create({
      to: phoneNumber,
      from: twilioPhoneNumber,
      url: `${callUrl}/?authCode=${authCode}`,
    });
  }

  return true;
};

export default sendAuthCodeViaCall;
