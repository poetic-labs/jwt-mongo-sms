import { MongoClient } from 'mongodb';
import Twilio from 'twilio';
import getAuthMiddleware from './getAuthMiddleware';
import sendAuthCodeViaCall from './sendAuthCodeViaCall';
import sendAuthCodeViaSms from './sendAuthCodeViaSms';
import usePassportStrategy from './usePassportStrategy';
import verifyAuthCode from './verifyAuthCode';

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
    setSmsMessage = (authCode => `Your authentication code is ${authCode}`),
    usersCollectionName = 'users',
    authCollectionName = 'users',
    requestKey = 'user',
    authCodeLength = 4,
    authCodeTimeoutSeconds = (60 * 10),
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
    this.authCodeLength = authCodeLength;
    this.authCodeTimeoutSeconds = authCodeTimeoutSeconds;

    usePassportStrategy({
      jwtSecret,
      getUsersCollection: () => this.getUsersCollection(),
    });
  }

  getAuthMiddleware() {
    return getAuthMiddleware(this.requestKey);
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

  async sendAuthCodeViaSms(phoneNumber) {
    return sendAuthCodeViaSms({
      phoneNumber,
      authCodeLength: this.authCodeLength,
      setMessage: this.setSmsMessage,
      getAuthCollection: () => this.getAuthCollection(),
      twilioClient: this.twilioClient,
      twilioPhoneNumber: this.twilioPhoneNumber,
    });
  }

  // Alias for "sendAuthCodeViaSms"
  async sendAuthCode(phoneNumber) {
    return this.sendAuthCodeViaSms(phoneNumber);
  }

  async sendAuthCodeViaCall(phoneNumber) {
    return sendAuthCodeViaCall({
      phoneNumber,
      authCodeLength: this.authCodeLength,
      getAuthCollection: () => this.getAuthCollection(),
      twilioClient: this.twilioClient,
      twilioPhoneNumber: this.twilioPhoneNumber,
      callUrl: this.callUrl,
    });
  }

  async verifyAuthCode({ authCode, phoneNumber }) {
    return verifyAuthCode({
      authCode,
      phoneNumber,
      getUsersCollection: () => this.getUsersCollection(),
      getAuthCollection: () => this.getAuthCollection(),
      authCodeTimeoutSeconds: this.authCodeTimeoutSeconds,
      jwtSecret: this.jwtSecret,
    });
  }
}

export default JwtMongoSms;
