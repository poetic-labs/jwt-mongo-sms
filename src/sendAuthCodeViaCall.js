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
  const code = generateAuthCode(authCodeLength);

  await upsertAuth({
    phoneNumber,
    code,
    getAuthCollection,
  });

  await twilioClient.calls.create({
    to: phoneNumber,
    from: twilioPhoneNumber,
    url: `${callUrl}/?authCode=${code}`,
  });
};

export default sendAuthCodeViaCall;
