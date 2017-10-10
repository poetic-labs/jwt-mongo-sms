import generateLoginCode from './generateLoginCode';
import upsertAuth from './upsertAuth';

const sendLoginCodeViaCall = async ({
  phoneNumber,
  loginCodeLength,
  getAuthCollection,
  twilioClient,
  twilioPhoneNumber,
  callUrl,
}) => {
  const loginCode = generateLoginCode(loginCodeLength);

  await upsertAuth({
    phoneNumber,
    loginCode,
    getAuthCollection,
  });

  await twilioClient.calls.create({
    to: phoneNumber,
    from: twilioPhoneNumber,
    url: `${callUrl}/?loginCode=${loginCode}`,
  });
};

export default sendLoginCodeViaCall;
