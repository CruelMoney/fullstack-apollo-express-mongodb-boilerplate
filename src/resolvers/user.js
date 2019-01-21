import jwt from 'jsonwebtoken';
import { combineResolvers } from 'graphql-resolvers';
import {
  AuthenticationError,
  UserInputError,
  ApolloError,
} from 'apollo-server';

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
    users: combineResolvers(
      isAdmin,
      async (parent, args, { models }) => {
        return await models.User.find();
      },
    ),
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
        emailVerified: false,
        role: null,
      });

      // defaults to first language in constants
      const settings = new models.UserSettings({
        userId: user.id,
        language: language || languages[0],
      });
      user.userSettings = settings.id;

      await settings.save();
      await user.save();

      return { token: createToken(user, secret, '1y') };
    },

    signIn: async (
      parent,
      { login, password },
      { models, secret },
    ) => {
      const user = await models.User.findByLogin(login);

      if (!user) {
        throw new UserInputError(
          'Ingen bruger fundet med givne initialer.',
        );
      }

      const isValid = await user.validatePassword(password);

      if (!isValid) {
        throw new AuthenticationError('Ugyldigt password.');
      }

      if (!user.emailVerified) {
        throw new AuthenticationError('Email er ikke bekræftet.');
      }

      return { token: createToken(user, secret, '1y') };
    },

    updateUser: combineResolvers(
      isAuthenticated,
      async (parent, { email, password }, { models, me }) => {
        if (email && email !== me.email) {
          throw new ApolloError(
            'Updating email not implemented yet.',
          );
        }

        return await models.User.findByIdAndUpdate(
          me.id,
          { email, password },
          {
            new: true,
          },
        );
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

    validateUserEmail: async (
      parent,
      { emailVerificationToken },
      { models },
    ) => {
      const user = await models.user.findByToken(
        emailVerificationToken,
      );
      if (!user) {
        throw new AuthenticationError('User not found');
      }
      const valid = await user.validateEmailVerificationToken(
        emailVerificationToken,
      );
      if (!valid) return false;

      user.emailVerified = true;
      await user.save();
      return true;
    },

    resetUserPassword: async (
      parent,
      { passwordResetToken, newPassword },
      { models },
    ) => {
      const user = await models.user.findByToken(passwordResetToken);
      if (!user) {
        throw new AuthenticationError('User not found');
      }
      const valid = await user.validatePasswordResetToken(
        passwordResetToken,
      );
      if (!valid) return false;

      user.password = newPassword;
      await user.save();

      return true;
    },
  },

  User: {
    userSettings: async (user, args, { models }) => {
      const settings = await models.UserSettings.findOne({
        userId: user.id,
      });
      return settings;
    },
  },
};
