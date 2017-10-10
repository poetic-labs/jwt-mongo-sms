# jwt-mongo-sms

If you're wondering how to implement authentication with JSON web tokens, Mongo DB, Twilio SMS, and (optionally) GraphQL, you're in the right place!

## Installation

```
npm install jwt-mongo-sms
```

or

```
yarn add jwt-mongo-sms
```

## Quickstart

(Before doing anything with this package, you'll need a [Mongo](https://www.mongodb.com/) database and a [Twilio](https://www.twilio.com/) account with a phone number to use for SMS.)

Create an instance of `JwtMongoSms`:
```javascript
import JwtMongoSms from 'jwt-mongo-sms';

const {
  JWT_SECRET,
  MONGODB_URI,
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_SMS_PHONE_NUMBER,
} = process.env;

const jwtMongoSms = new JwtMongoSms({
  jwtSecret: JWT_SECRET,
  mongoUri: MONGODB_URI,
  twilio: {
    accountSid: TWILIO_ACCOUNT_SID,
    authToken: TWILIO_AUTH_TOKEN,
    phoneNumber: TWILIO_SMS_PHONE_NUMBER,
  },
});

export default jwtMongoSms;
```

Add the middleware to your server:
```javascript
import express from 'express';
import jwtMongoSms from './jwtMongoSms';

const server = express();

server.use(jwtMongoSms.getAuthMiddleware());
```

With the middleware you can check `request.user` in each request to determine which user (if any) has been authenticated! NOTE: You will need to store the JWT on the client using `localStorage`, cookies, or another method, and send it via the request `Authorization` header. See the GraphQL samples below.

## GraphQL usage

Sample login resolvers:
```javascript
const sendLoginCode = async (obj, { phoneNumber }) => {
  await jwtMongoSms.sendLoginCode(phoneNumber);

  return true;
};

const verifyLoginCode = async (obj, { phoneNumber, loginCode }) => {
  const { user, authToken } = await jwtMongoSms.verifyLoginCode({ phoneNumber, loginCode });

  return { user, authToken };
};
```

Sample auth token storage on client with [Apollo](https://www.npmjs.com/package/apollo-client):
```javascript
apolloClient.mutate({
  mutation: gql`
    mutation verifyLoginCode($phoneNumber: String!, $loginCode: String!) {
      verifyLoginCode(phoneNumber: $phoneNumber, loginCode: $loginCode) {
        authToken
      }
    }
  `,
  variables: {
    phoneNumber: '+15555555555',
    loginCode: '1234',
  },
})
  .then(({ data }) => {
    localStorage.setItem('authToken', data.verifyLoginCode.authToken);
  })
```

Sample Apollo middleware that makes authorized requests:
```javascript
networkInterface.use([{
  applyMiddleware(request, next) {
    const authToken = localStorage.getItem('authToken');

    if (!request.options.headers) {
      request.options.headers = {};
    }

    if (authToken) {
      request.options.headers.authorization = `JWT ${authToken}`;
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
    user: request.user, // Configure this key with "requestKey" (defaults to "user")
  },
})));
```

Sample query resolver with authentication:
```javascript
const guardedResolver = (obj, args, { user }) => {
  if (!user) { // If empty, the user was not authenticated
    throw new GraphQLError('Unauthorized');
  }

  return SensitiveUserData.findOne({ userId: user._id });
};
```

## Configuration

There are three required fields when instantiating a `JwtMongoSms` object: `jwtSecret`, `mongoUri`, and `twilio`. Configuring the rest is optional.

Field|Default Value|Description
---|---|---
jwtSecret||JSON web token [secret](https://jwt.io/introduction/)
mongoUri||[Mongo](https://www.mongodb.com/) URI (e.g., `mongodb://localhost/my-db`)
twilio|`{}`|[Twilio](https://www.twilio.com/) credentials (`accountSid`, `authToken`) and `phoneNumber` used to send SMS text
setSmsMessage|```(code => `Your login code is ${code}`)```|Function used to set the SMS message for login
usersCollectionName|users|Name of the Mongo collection used to store user data
authCollectionName|users|Name of the Mongo collection used to store auth data
requestKey|user|Key your authenticated user will be assigned to on each server `request`
loginCodeLength|4|Length of login code
loginCodeTimeoutSeconds|600|Number of seconds it takes for a login code to expire

## API

There are three methods from the `JwtMongoSms` class you should use:

```
getAuthMiddleware() : express.Handler[]
```

* Returns the middleware needed for authenticating server requests.

```
sendLoginCode(phoneNumber: string) : Promise<void>
```

* Sends login code via Twilio SMS. Upserts auth collection document for `phoneNumber` with new `loginCode` and `loginCodeCreatedAt`. NOTE: By default `userCollectionName` and `authCollectionName` are both set to `users`. That means if you don't override these settings, this method will insert a user document for you (if it doesn't already exist). To avoid this behavior, be sure to create the user document beforehand.

```
verifyLoginCode({ phoneNumber: string, loginCode: string }) : Promise<{ user: Object, authToken: string }>
```

* Verifies inputted login code. Will throw errors if no auth data is found, no login code has been generated, the compared codes do not match, or if the login code has expired. When verified, the found `user` document and a generated `authToken` are returned.
