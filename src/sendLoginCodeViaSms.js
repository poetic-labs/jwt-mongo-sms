import generateLoginCode from './generateLoginCode';
import upsertAuth from './upsertAuth';

const sendLoginCodeViaSms = async ({
  phoneNumber,
  loginCodeLength,
  setMessage,
  getAuthCollection,
  twilioClient,
  twilioPhoneNumber,
}) => {
  const loginCode = generateLoginCode(loginCodeLength);
  const message = setMessage(loginCode);

  await upsertAuth({
    phoneNumber,
    loginCode,
    getAuthCollection,
  });

  await twilioClient.messages.create({
    to: phoneNumber,
    body: message,
    from: twilioPhoneNumber,
  });
};

export default sendLoginCodeViaSms;
