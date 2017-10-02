import moment from 'moment';
import generateLoginCode from './generateLoginCode';

const sendLoginCode = async ({
  phoneNumber,
  setMessage,
  getAuthCollection,
  twilioClient,
  twilioPhoneNumber,
}) => {
  const loginCode = generateLoginCode();
  const message = setMessage(loginCode);

  const authCollection = await getAuthCollection();

  await authCollection.findOneAndUpdate({ phoneNumber }, {
    loginCode,
    loginCreatedAt: moment().utc().toDate(),
  }, {
    upsert: true,
  });

  await twilioClient.messages.create({
    body: message,
    to: phoneNumber,
    from: twilioPhoneNumber,
  });
};

export default sendLoginCode;
