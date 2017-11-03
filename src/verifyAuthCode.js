import jwt from 'jwt-simple';
import moment from 'moment';

const verifyAuthCode = async ({
  authCode,
  authCodeTimeoutSeconds,
  encodeUserId,
  getAuthCollection,
  getUsersCollection,
  isWhitelisted,
  jwtSecret,
  phoneNumber,
}) => {
  if (!isWhitelisted) {
    const authCollection = await getAuthCollection();
    const auth = await authCollection.findOne({ phoneNumber });

    if (!auth) {
      throw new Error(`No authentication info found for ${phoneNumber}`);
    }

    if (!auth.authCode) {
      throw new Error(`No code has been generated for ${phoneNumber}`);
    }

    if (moment().diff(moment(auth.authCodeCreatedAt), 'seconds') >= authCodeTimeoutSeconds) {
      throw new Error('Code has expired');
    }

    if (auth.authCode !== authCode) {
      throw new Error('Code does not match');
    }
  }

  const usersCollection = await getUsersCollection();
  const user = await usersCollection.findOne({ phoneNumber });

  // eslint-disable-next-line no-underscore-dangle
  const authToken = jwt.encode({ _id: encodeUserId(user._id) }, jwtSecret);

  return { user, authToken };
};

export default verifyAuthCode;
