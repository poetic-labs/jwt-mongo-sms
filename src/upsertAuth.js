import moment from 'moment';

const upsertAuth = async ({
  phoneNumber,
  loginCode,
  getAuthCollection,
}) => {
  const authCollection = await getAuthCollection();

  await authCollection.findOneAndUpdate({ phoneNumber }, {
    $set: {
      phoneNumber,
      loginCode,
      loginCreatedAt: moment().utc().toDate(),
    },
  }, {
    upsert: true,
  });
};

export default upsertAuth;
