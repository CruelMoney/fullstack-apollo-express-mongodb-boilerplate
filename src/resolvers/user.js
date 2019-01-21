import jwt from 'jsonwebtoken';
import { combineResolvers } from 'graphql-resolvers';
import { AuthenticationError, UserInputError } from 'apollo-server';

import { isAdmin, isAuthenticated } from './authorization';
import { languages } from '../constants';

const createToken = async (user, secret, expiresIn) => {
  const { id, email, role } = user;
  return await jwt.sign({ id, email, role }, secret, {
    expiresIn,
  });
};

export default {
  Query: {
    users: async (parent, args, { models }) => {
      return await models.User.find();
    },
    user: async (parent, { id }, { models }) => {
      return await models.User.findById(id);
    },
    me: async (parent, args, { models, me }) => {
      if (!me) {
        return null;
      }

      return await models.User.findById(me.id);
    },
  },

  Mutation: {
    signUp: async (
      parent,
      { email, password, language },
      { models, secret },
    ) => {
      const user = new models.User({
        email,
        password,
      });
      const settings = new models.UserSettings({
        userId: user.id,
        language: language || languages[0], // defaults to first language in constants
      });
      user.userSettings = settings.id;

      await settings.save();
      await user.save();

      return { token: createToken(user, secret, '30m') };
    },

    signIn: async (
      parent,
      { login, password },
      { models, secret },
    ) => {
      const user = await models.User.findByLogin(login);

      if (!user) {
        throw new UserInputError(
          'No user found with this login credentials.',
        );
      }

      const isValid = await user.validatePassword(password);

      if (!isValid) {
        throw new AuthenticationError('Invalid password.');
      }

      return { token: createToken(user, secret, '30m') };
    },

    updateUser: combineResolvers(
      isAuthenticated,
      async (parent, { ...fields }, { models, me }) => {
        if (fields.email !== me.email) {
          throw new Error('Updating email not implemented yet.');
        }

        return await models.User.findByIdAndUpdate(me.id, fields, {
          new: true,
        });
      },
    ),

    deleteUser: combineResolvers(
      isAdmin,
      async (parent, { id }, { models }) => {
        return await models.User.findOneAndDelete({ _id: id }).then(
          () => true,
        );
      },
    ),
  },

  User: {
    // messages: async (user, args, { models }) => {
    //   return await models.Message.find({
    //     userId: user.id,
    //   });
    // },
    userSettings: async (user, args, { models }) => {
      return await models.UserSettings.find({
        userId: user.id,
      });
    },
  },
};
