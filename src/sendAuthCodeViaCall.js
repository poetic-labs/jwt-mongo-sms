import generateAuthCode from './generateAuthCode';
import upsertAuth from './upsertAuth';

const sendAuthCodeViaCall = async ({
  phoneNumber,
  authCodeLength,
  getAuthCollection,
  twilioClient,
  twilioPhoneNumber,
  callUrl,
}) => {
  const authCode = generateAuthCode(authCodeLength);

  await upsertAuth({
    phoneNumber,
    authCode,
    getAuthCollection,
  });

  await twilioClient.calls.create({
    to: phoneNumber,
    from: twilioPhoneNumber,
    url: `${callUrl}/?authCode=${authCode}`,
  });
};

export default sendAuthCodeViaCall;
