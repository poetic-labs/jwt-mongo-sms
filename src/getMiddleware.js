import passport from 'passport';

const getMiddleware = (requestKey) => {
  const authenticate = (request, response, next) => {
    passport.authenticate('jwt', { session: false }, (error, user) => {
      if (user) {
        request[requestKey] = user;
      }

      next();
    })(request, response);
  };

  return [passport.initialize(), authenticate];
};

export default getMiddleware;
