import jwt from 'jwt-simple';
import moment from 'moment';

const verifyLoginCode = async ({
  phoneNumber,
  loginCode,
  getUsersCollection,
  getAuthCollection,
  loginCodeTimeoutSeconds,
  jwtSecret,
}) => {
  const usersCollection = await getUsersCollection();
  const authCollection = await getAuthCollection();

  const user = await usersCollection.findOne({ phoneNumber });
  const auth = await authCollection.findOne({ phoneNumber });

  if (!auth) {
    throw new Error(`No auth information found for ${phoneNumber}`);
  }

  if (!auth.loginCode) {
    throw new Error(`No code has been generated for ${phoneNumber}`);
  }

  if (auth.loginCode !== loginCode) {
    throw new Error('Code does not match');
  }

  if (moment().diff(moment(auth.loginCodeCreatedAt), 'seconds') >= loginCodeTimeoutSeconds) {
    throw new Error('Code has expired');
  }

  // eslint-disable-next-line no-underscore-dangle
  const authToken = jwt.encode({ _id: user._id }, jwtSecret);

  return { user, authToken };
};

export default verifyLoginCode;
