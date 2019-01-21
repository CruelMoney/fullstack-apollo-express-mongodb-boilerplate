import models from '../models/index';
import { languages } from '../constants';

const users = [
  new models.User({
    email: 'test1@test.com',
    password: 'test1',
    role: null,
  }),
  new models.User({
    email: 'test2@test.com',
    password: 'test2',
    role: null,
  }),
  new models.User({
    email: 'test3@test.com',
    password: 'test3',
    role: null,
  }),
  new models.User({
    email: 'test4@test.com',
    password: 'test4',
    role: null,
  }),
];

const generateUsers = async _ =>
  await Promise.all(
    users.map(async u => {
      const settings = new models.UserSettings({
        language: languages[0],
        userId: u.id,
      });
      await settings.save();
      u.userSettings = settings.id;
      await u.save();
    }),
  );

export { users, generateUsers };
