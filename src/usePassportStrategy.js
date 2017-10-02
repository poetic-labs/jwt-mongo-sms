import passport from 'passport';
import { Strategy, ExtractJwt } from 'passport-jwt';

const usePassportStrategy = ({ jwtSecret, getUsersCollection }) => {
  const strategy = new Strategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme('jwt'),
      secretOrKey: jwtSecret,
    },
    async (jwtPayload, done) => {
      try {
        let user = null;

        if (jwtPayload) {
          const usersCollection = await getUsersCollection();

          // eslint-disable-next-line no-underscore-dangle
          user = await usersCollection.findOne({ _id: jwtPayload._id });
        }

        done(null, user || false);
      } catch (error) {
        done(error, null);
      }
    },
  );

  passport.use(strategy);
};

export default usePassportStrategy;
