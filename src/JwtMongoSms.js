import { MongoClient } from 'mongodb';
import Twilio from 'twilio';
import getMiddleware from './getMiddleware';
import sendLoginCode from './sendLoginCode';
import usePassportStrategy from './usePassportStrategy';
import verifyLoginCode from './verifyLoginCode';

class JwtMongoSms {
  constructor({
    jwtSecret,
    mongoUri,
    twilio = {
      phoneNumber: undefined,
      accountSid: undefined,
      authToken: undefined,
    },
    setSmsMessage = (code => `Your login code is ${code}`),
    usersCollectionName = 'users',
    authCollectionName = 'users',
    requestKey = 'user',
    loginCodeLength = 4,
    loginCodeTimeoutSeconds = (60 * 10),
  }) {
    this.jwtSecret = jwtSecret;
    this.mongoUri = mongoUri;
    this.twilioPhoneNumber = twilio.phoneNumber;
    this.twilioClient = new Twilio(twilio.accountSid, twilio.authToken);
    this.setSmsMessage = setSmsMessage;

    this.usersCollectionName = usersCollectionName;
    this.authCollectionName = authCollectionName;
    this.loginCodeLength = loginCodeLength;
    this.loginCodeTimeoutSeconds = loginCodeTimeoutSeconds;
    this.requestKey = requestKey;

    usePassportStrategy({
      jwtSecret,
      getUsersCollection: this.getUsersCollection,
    });
  }

  async getMongoCollection(name) {
    if (!this.mongoConnection) {
      this.mongoConnection = await MongoClient.connect(this.mongoUri);
    }

    return this.mongoConnection.collection(name);
  }

  async getAuthCollection() {
    return this.getMongoCollection(this.authCollectionName);
  }

  async getUsersCollection() {
    return this.getMongoCollection(this.usersCollectionName);
  }

  getMiddleware() {
    return getMiddleware(this.requestKey);
  }

  async sendLoginCode(phoneNumber) {
    return sendLoginCode({
      phoneNumber,
      setMessage: this.setSmsMessage,
      getAuthCollection: this.getAuthCollection,
      twilioClient: this.twilioClient,
      twilioPhoneNumber: this.twilioPhoneNumber,
    });
  }

  async verifyLoginCode({ loginCode, phoneNumber }) {
    return verifyLoginCode({
      loginCode,
      phoneNumber,
      getUsersCollection: this.getUsersCollection,
      getAuthCollection: this.getAuthCollection,
      loginCodeTimeoutSeconds: this.loginCodeTimeoutSeconds,
      jwtSecret: this.jwtSecret,
    });
  }
}

export default JwtMongoSms;
