import { gql } from 'apollo-server-express';

export default gql`
  extend type Query {
    userSettings(id: ID!): UserSettings!
  }

  extend type Mutation {
    updateUserSettings(language: AllowedLanguage!): UserSettings!
  }

  type UserSettings {
    id: ID!
    language: AllowedLanguage!
    user: User!
  }
`;
