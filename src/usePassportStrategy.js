import passport from 'passport';
import { Strategy, ExtractJwt } from 'passport-jwt';

const usePassportStrategy = ({ decodeUserId, getUsersCollection, jwtSecret }) => {
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

          user = await usersCollection.findOne({
            // eslint-disable-next-line no-underscore-dangle
            _id: decodeUserId(jwtPayload._id),
          });
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
