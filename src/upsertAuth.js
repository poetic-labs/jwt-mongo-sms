import moment from 'moment';

const upsertAuth = async ({
  authCode,
  getAuthCollection,
  phoneNumber,
}) => {
  const authCollection = await getAuthCollection();

  await authCollection.findOneAndUpdate({ phoneNumber }, {
    $set: {
      phoneNumber,
      authCode,
      authCodeCreatedAt: moment().utc().toDate(),
    },
  }, {
    upsert: true,
  });
};

export default upsertAuth;
