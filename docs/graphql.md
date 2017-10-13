# jwt-mongo-sms

## GraphQL usage

These samples assume you have some familiarity with GraphQL (schemas, resolvers, middleware, etc.). If requested, a comprehensive example app might be posted in the future. But for now this should help get you started.

Sample schema:
```javascript
export default `
  type User {
    phoneNumber: String!
  }

  type Session {
    authToken: ID!
    user: User!
  }

  type Mutation {
    sendAuthCode(phoneNumber: String!): Boolean!

    verifyAuthCode(phoneNumber: String!, authCode: String!): Session!
  }
`;
```

Sample mutation resolvers:
```javascript
import jwtMongoSms from './jwtMongoSms'; // from wherever you instantiated JwtMongoSms

const sendAuthCode = (obj, { phoneNumber }) => {
  // You can either create a user doc here with "phoneNumber" OR if your auth and
  // users collections are the same, jwtMongoSms will create a user doc for you below

  return jwtMongoSms.sendAuthCode(phoneNumber); // if successful, returns true
};

const verifyAuthCode = (obj, { phoneNumber, authCode }) => (
  jwtMongoSms.verifyAuthCode({ phoneNumber, authCode }) // if successful, returns { user, authToken }
);
```

Sample auth token storage on client with [Apollo](https://www.npmjs.com/package/apollo-client):
```javascript
apolloClient.mutate({
  mutation: gql`
    mutation verifyAuthCode($phoneNumber: String!, $authCode: String!) {
      verifyAuthCode(phoneNumber: $phoneNumber, authCode: $authCode) {
        authToken
      }
    }
  `,
  variables: {
    phoneNumber: '+15555555555',
    authCode: '1234',
  },
})
  .then(({ data }) => {
    // NOTE: You can use another method (such as cookies) to store the token on the client
    localStorage.setItem('authToken', data.verifyAuthCode.authToken);
  })
```

Sample Apollo middleware that makes authorized requests:
```javascript
networkInterface.use([{
  applyMiddleware(request, next) {
    const authToken = localStorage.getItem('authToken');

    if (authToken) {
      request.options.headers = {
        ...request.options.headers,
        authorization: `JWT ${authToken}`,
      };
    }

    next();
  },
}]);
```

Setting context for resolvers that require authentication:
```javascript
server.use('/graphql', bodyParser.json(), graphqlExpress((request) => ({
  schema,
  context: {
    user: request.user, // Configure this key in JwtMongoSms with "requestKey" (defaults to "user")
  },
})));
```

Sample query resolver with authentication:
```javascript
const guardedQuery = (obj, args, { user }) => {
  if (!user) { // If empty, the user was not authenticated
    throw new GraphQLError('Unauthorized');
  }

  return SomeCollectionWithPrivateuserData.findOne({ userId: user._id });
};
```
