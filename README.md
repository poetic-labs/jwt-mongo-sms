# jwt-mongo-sms

If you're wondering how to implement authentication with JSON web tokens, Mongo DB, Twilio SMS, and (optionally) GraphQL, you're in the right place!

## Installation

```sh
npm install jwt-mongo-sms
```

or

```sh
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

Set up REST endpoints to send and verify authentication code (for GraphQL, see [Examples](#examples) below):
```javascript
import bodyParser from 'body-parser';
import express from 'express';
import jwtMongoSms from './jwtMongoSms'; // from wherever you instantiated JwtMongoSms

const app = express();

// Parses request body as object
app.use(bodyParser.urlencoded());

// Sample route that sends authentication code via SMS
app.post('/send-auth-code', (request, response) => {
  const { phoneNumber } = request.body;

  jwtMongoSms.sendAuthCode(phoneNumber);

  response.end();
});

// Sample route that verifies authentication code (on success, returns a JSON web token and user data)
app.post('/verify-auth-code', async (request, response) => {
  const { phoneNumber, authCode } = request.body;
  const { authToken, user } = await jwtMongoSms.verifyAuthCode({ phoneNumber, authCode });

  response.json({ authToken, user });
});

// Authenticates each server request by checking for a JSON web token in the "Authorization" header
app.use(jwtMongoSms.getAuthMiddleware());

// Sample authenticated route
app.get('/profile', (request, response) => {
  if (request.user) {
    res.status(200).send('Authenticated!');
  } else {
    res.status(401).send('Unauthorized!');
  }
});
```

Once an authentication code is verified, the client will receive a JSON web token. To make authenticated requests, you will need to store this token on the client (using `localStorage`, cookies, or any other preferred method) and send it via the request `Authorization` header. If your JSON web token were `abc123`, for instance, the header value would be `JWT abc123`. (For more details, see the [GraphQL example](#examples) below.)

Finally, with the middleware in place, you can check `request.user` in any subsequent server request to determine which user (if any) has been authenticated!

## Examples

[GraphQL](docs/graphql.md)

## Configuration

There are three required fields when instantiating a `JwtMongoSms` object: `jwtSecret`, `mongoUri`, and `twilio`. Configuring the rest is optional.

Field|Default Value|Description
---|---|---
jwtSecret||JSON web token [secret](https://jwt.io/introduction/)
mongoUri||[Mongo](https://www.mongodb.com/) URI (e.g., `mongodb://localhost/my-db`)
twilio|`{}`|[Twilio](https://www.twilio.com/) credentials (`accountSid`, `authToken`) and `phoneNumber` used to send SMS text
setSmsMessage|```(authCode => `Your authentication code is ${authCode}`)```|Used to set the message for SMS authentication
usersCollectionName|users|Name of the Mongo collection used to store user data
authCollectionName|users|Name of the Mongo collection used to store auth data
requestKey|user|Key your authenticated user will be assigned to on each server `request`
authCodeLength|4|Length of authentication code
authCodeTimeoutSeconds|600|Number of seconds it takes for a authentication code to expire
decodeUserId|```(userId => ObjectId.createFromHexString(userId))```|Determines the format of `_id` for the auth middleware user query. If your user ids are stored as strings instead of ObjectIds (e.g., Meteor), you should replace this with `(userId) => userId)`

## API

The following are methods from the `JwtMongoSms` class you can use (from an instantiated object):

```
getAuthMiddleware() : express.Handler[]
```

* Returns the middleware needed for authenticating server requests.

```
sendAuthCode(phoneNumber: string) : Promise<boolean>
```

* Sends authentication code via Twilio SMS. Upserts auth collection document for `phoneNumber` with new `authCode` and `authCodeCreatedAt`. NOTE: By default `userCollectionName` and `authCollectionName` are both set to `users`. That means if you don't override these settings, this method will insert a user document for you (if it doesn't already exist). To avoid this behavior, be sure to create the user document beforehand.

```
verifyAuthCode({ phoneNumber: string, authCode: string }) : Promise<{ user: Object, authToken: string }>
```

* Verifies inputted authentication code. Will throw errors if no auth data is found, no code has been generated, the compared codes do not match, or if the code has expired. When verified, the found `user` document and a generated `authToken` are returned.

```
createAuthIndex(fieldOrSpec: string = 'phoneNumber', IndexOptions: object = { unique: true }): Promise<string>
createUsersIndex(fieldOrSpec: string = 'phoneNumber', IndexOptions: object = { unique: true }): Promise<string>
```

* Indexes the auth and users collections respectively. Each defaults to a unique index on `phoneNumber` for faster lookup and data integrity. See the [MongoDB documentation](http://mongodb.github.io/node-mongodb-native/2.1/api/Collection.html#createIndex) for more info on `fieldOrSpec` and `options`.

## Issues

If you experience bugs, try upgrading to the latest version and checking the [changelog](CHANGELOG.md). You can also post an issue on GitHub!
