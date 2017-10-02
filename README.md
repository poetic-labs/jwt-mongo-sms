# jwt-mongo-sms

If you were wondering how to implement Node authentication with JSON web tokens, Mongo DB, Twilio SMS, and (optionally) GraphQL, you're in the right place!

## Installation

```
npm install jwt-mongo-sms
```
or
```
yarn add jwt-mongo-sms
```

## Quickstart

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

server.use(jwtMongoSms.getMiddleware());
```

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
mongoUri||Mongo URI (e.g., `mongodb://localhost/my-db`)
twilio|`{}`|Twilio credentials (`accountSid`, `authToken`) and `phoneNumber` used to send SMS text
setSmsMessage|```(code => `Your login code is ${code}`)```|Function used to set the SMS message for login
usersCollectionName|users|Name of the Mongo collection used to store user data
authCollectionName|users|Name of the Mongo collection used to store auth data
requestKey|user|Key your authenticated user will be assigned to on each server `request`
loginCodeLength|4|Length of login code
loginCodeTimeoutSeconds|600|Number of seconds it takes for a login code to expire

## API

There are three methods from the `JwtMongoSms` class you should use:

```
getMiddleware() : express.Handler[]
```
* Returns the middleware needed for authenticating server requests.

```
sendLoginCode(phoneNumber: string) : Promise<void>
```
* Sends login code via Twilio SMS. Upserts auth collection document for `phoneNumber` with new `loginCode` and `loginCreatedAt`. By default `JwtMongoSms` uses the same collection for user data as it does for auth data. That means this method will create your user document for you if it doesn't already exist. To avoid this behavior, be sure to create your user document beforehand.

```
verifyLoginCode({ phoneNumber: string, loginCode: string }) : Promise<{ user: Object, authToken: string }>
```
* Verifies inputted login code. Will throw errors if no user data is found, no auth data is found, no login code has been generated, the compared codes do not match, or if the login code has expired. When verified, the `user` document and a generated `authToken` are returned.
