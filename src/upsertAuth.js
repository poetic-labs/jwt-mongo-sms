import moment from 'moment';

const upsertAuth = async ({
  phoneNumber,
  code,
  getAuthCollection,
}) => {
  const authCollection = await getAuthCollection();

  await authCollection.findOneAndUpdate({ phoneNumber }, {
    $set: {
      phoneNumber,
      code,
      codeCreatedAt: moment().utc().toDate(),
    },
  }, {
    upsert: true,
  });
};

export default upsertAuth;
