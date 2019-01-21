import { combineResolvers } from 'graphql-resolvers';

import pubsub, { EVENTS } from '../subscription';
import { isAuthenticated, isMessageOwner } from './authorization';

export default {
  Query: {
    userSettings: async (parent, { id }, { models }) => {
      return await models.UserSettings.findById(id);
    },
  },

  Mutation: {
    updateUserSettings: combineResolvers(
      isAuthenticated,
      async (parent, options, { models, me }) => {
        return await models.UserSettings.findByIdAndUpdate(
          me.id,
          options,
        );
      },
    ),
  },

  UserSettings: {
    user: async (userSettings, args, { loaders }) => {
      const user = await loaders.user.load(userSettings.userId);
      return user;
    },
  },
};
