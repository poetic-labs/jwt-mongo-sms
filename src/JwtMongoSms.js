import { MongoClient } from 'mongodb';
import Twilio from 'twilio';
import getAuthMiddleware from './getAuthMiddleware';
import sendLoginCodeViaCall from './sendLoginCodeViaCall';
import sendLoginCodeViaSms from './sendLoginCodeViaSms';
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
    callUrl,
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
    this.callUrl = callUrl;

    this.setSmsMessage = setSmsMessage;
    this.usersCollectionName = usersCollectionName;
    this.authCollectionName = authCollectionName;
    this.requestKey = requestKey;
    this.loginCodeLength = loginCodeLength;
    this.loginCodeTimeoutSeconds = loginCodeTimeoutSeconds;

    usePassportStrategy({
      jwtSecret,
      getUsersCollection: () => this.getUsersCollection(),
    });
  }

  getAuthMiddleware() {
    return getAuthMiddleware(this.requestKey);
  }

  getMiddleware() {
    // eslint-disable-next-line no-console
    console.warn('"getMiddleware" is deprecated. Please use "getAuthMiddleware" instead.');

    return this.getAuthMiddleware();
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

  async createAuthIndex(fieldOrSpec = 'phoneNumber', options = { unique: true }) {
    const authCollection = await this.getAuthCollection();

    authCollection.createIndex(fieldOrSpec, options);
  }

  async createUsersIndex(fieldOrSpec = 'phoneNumber', options = { unique: true }) {
    const usersCollection = await this.getUsersCollection();

    usersCollection.createIndex(fieldOrSpec, options);
  }

  async sendLoginCodeViaSms(phoneNumber) {
    return sendLoginCodeViaSms({
      phoneNumber,
      loginCodeLength: this.loginCodeLength,
      setMessage: this.setSmsMessage,
      getAuthCollection: () => this.getAuthCollection(),
      twilioClient: this.twilioClient,
      twilioPhoneNumber: this.twilioPhoneNumber,
    });
  }

  // Alias for "sendLoginCodeViaSms"
  async sendLoginCode(phoneNumber) {
    return this.sendLoginCodeViaSms(phoneNumber);
  }

  async sendLoginCodeViaCall(phoneNumber) {
    return sendLoginCodeViaCall({
      phoneNumber,
      loginCodeLength: this.loginCodeLength,
      getAuthCollection: () => this.getAuthCollection(),
      twilioClient: this.twilioClient,
      twilioPhoneNumber: this.twilioPhoneNumber,
      callUrl: this.callUrl,
    });
  }

  async verifyLoginCode({ loginCode, phoneNumber }) {
    return verifyLoginCode({
      loginCode,
      phoneNumber,
      getUsersCollection: () => this.getUsersCollection(),
      getAuthCollection: () => this.getAuthCollection(),
      loginCodeTimeoutSeconds: this.loginCodeTimeoutSeconds,
      jwtSecret: this.jwtSecret,
    });
  }
}

export default JwtMongoSms;
