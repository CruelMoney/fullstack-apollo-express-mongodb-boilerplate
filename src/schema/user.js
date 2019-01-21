import { gql } from 'apollo-server-express';

export default gql`
  extend type Query {
    users: [User!]
    user(id: ID!): User
    me: User
  }

  extend type Mutation {
    signUp(
      email: String!
      password: String!
      language: String
    ): Token!
    signIn(login: String!, password: String!): Token!
    updateUser(email: String): User!
    deleteUser(id: ID!): Boolean!
    validateUserEmail(emailVerificationToken: String!): Boolean!
    resetUserPassword(
      passwordResetToken: String!
      newPassword: String!
    ): Boolean!
    requestPasswordReset(email: String!): Boolean!
  }

  type Token {
    token: String!
  }

  type User {
    id: ID!
    email: String!
    role: String
    userSettings: UserSettings!
    emailVerified: Boolean!
  }
`;
