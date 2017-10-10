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
  const code = generateAuthCode(authCodeLength);
  const message = setMessage(code);

  await upsertAuth({
    phoneNumber,
    code,
    getAuthCollection,
  });

  await twilioClient.messages.create({
    to: phoneNumber,
    body: message,
    from: twilioPhoneNumber,
  });
};

export default sendAuthCodeViaSms;
