import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import { DataModel } from "./_generated/dataModel";

const EmailOTP = Password<DataModel>({
  id: "email-otp",
  otp: {
    // OTP expires in 10 minutes
    expiresIn: 600,
  },
  profile: {
    from: "email",
    transform: (profile, { email }) => {
      return {
        email,
        emailVerificationTime: Date.now(),
        name: email.split("@")[0],
      };
    },
  },
});

const Anonymous = Password<DataModel>({
  id: "anonymous",
  // Anonymous users don't need passwords
  password: false,
  profile: {
    transform: () => {
      return {
        isAnonymous: true,
        name: "Guest",
      };
    },
  },
});

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [EmailOTP, Anonymous],
});
