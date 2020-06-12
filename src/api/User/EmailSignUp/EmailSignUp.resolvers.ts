import { Resolvers } from "../../../types/resolvers";
import Verification from "../../../entities/Verification";
import { EmailSignUpMutationArgs, EmailSignUpResponse } from "src/types/graph";
import User from "../../../entities/User";
import createJWT from "../../../utils/createJWT";
import { sendVerificationEmail } from "src/utils/sendEmail";

const resolvers: Resolvers = {
  Mutation: {
    EmailSignUp: async (
      _,
      args: EmailSignUpMutationArgs
    ): Promise<EmailSignUpResponse> => {
      const { email, phoneNumber } = args;
      try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return {
            ok: true,
            error: "You should log in instead",
            token: null,
          };
        } else {
          const phoneVerification = await Verification.findOne({
            payload: phoneNumber,
            verified: true,
          });
          if (phoneVerification) {
            const newUser = await User.create({ ...args }).save();
            if (newUser.email) {
              const emailVerification = await Verification.create({
                payload: newUser.email,
                target: "EMAIL",
              });
              await sendVerificationEmail(
                newUser.fullName,
                emailVerification.key
              );
            }
            const token = createJWT(newUser.id);
            return {
              ok: true,
              error: null,
              token,
            };
          } else {
            return {
              ok: true,
              error: "You haven't verified your phone number",
              token: null,
            };
          }
        }
      } catch (error) {
        return {
          ok: false,
          error: error.messeage,
          token: null,
        };
      }
    },
  },
};

export default resolvers;
