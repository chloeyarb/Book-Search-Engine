const { User } = require('../models');
const { AuthenticationError } = require('apollo-server-express');
const { signToken } = require('../utils/auth');

const resolvers = {
    Query: {
        me: async (parent, args, context) => {
            if (context.user) {
                const userData = await User.findOne({ _id: context.user._id })
                    .select('__v -password')
                    .populate('books');

                return userData;
            }
            throw new AuthenticationError('User not logged in!');
        }
    },
    Mutation: {
        addUser: async (parent, args) => {
            const user = await User.create(args);
            const token = signToken(user);

            return { token, user };
        },
        login: async (parent, { email, password }) => {
            const user = await User.findOne({ email });
            if (!user) {
                throw new AuthenticationError('Credentials Incorrect');
            }
            const cPassword = await user.iscorrectPassword(password);
            if (!cPassword) {
                throw new AuthenticationError('Credentials Incorrect');
            }
            const token = signToken(user);
            return { token, user };
        },
        saveBook: async (parent, {bookData }, context) => {
            if (context.user) {
                const updatedUser = await User.findOneAndUpdate(
                    { _id: context.user._id },
                    { $addToSet: { savedBooks: bookData } },
                    { new: true }
                ).populate('savedBooks');
                return updatedUser;
            }
            throw new AuthenticationError('Must be logged in.');
        },
        removeBook: async (parent, { bookId }, context) => {
            if (context.user) {
                const updatedUser = await User.findOneAndUpdate(
                    { _id: context.user._id },
                    { $pull: { savedBooks: { bookId: bookId } } },
                    { new: true }
                )
                return updatedUser;
            }
            throw new AuthenticationError('Must be logged in.');
        }
    }
};

module.exports = resolvers;