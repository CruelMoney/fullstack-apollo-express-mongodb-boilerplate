import { GraphQLDateTime } from 'graphql-iso-date';
import GraphQLJSON from 'graphql-type-json';
import userResolvers from './user';
import { languages } from '../constants';

const customScalarResolver = {
  Date: GraphQLDateTime,
  JSON: GraphQLJSON,
  Query: {
    availableLanguages: _ => languages,
  },
};

export default [customScalarResolver, userResolvers];
