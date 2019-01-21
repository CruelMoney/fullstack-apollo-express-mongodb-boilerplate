import { gql } from 'apollo-server-express';
import userSchema from './user';
import messageSchema from './message';
import userSettings from './userSettings';
import { languages } from '../constants';

const linkSchema = gql`
  scalar Date
  scalar JSON

  enum AllowedLanguage {${languages.reduce(
    (str, l) => str + `${l}\n`,
    '',
  )}}

  type Query {
    _: Boolean
    languages: AllowedLanguage
  }

  type Mutation {
    _: Boolean
  }

  type Subscription {
    _: Boolean
  }
`;

export default [linkSchema, userSchema, userSettings];
