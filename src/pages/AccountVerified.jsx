import { Link } from "react-router-dom";
import { Icon } from "@iconify/react";

function AccountVerified() {
  return (
    <>
      <div className="min-h-screen min-w-screen flex items-center justify-center flex-col">
        <Icon
          icon="ph:seal-check"
          width="200"
          height="200"
          color="var(--color-primary)"
        />
        <h2 className="text-2xl font-bold mt-4">Account Verified</h2>
        <p className="text-gray-600 mt-2">
          Your account was successfully verified.
        </p>
        <Link
          to="/"
          className="w-xs mt-8 bg-primary text-white px-6 py-3 rounded-md hover:bg-primary-light transition-colors cursor-pointer font-medium flex justify-center"
        >
          Continue
        </Link>
      </div>
    </>
  );
}

export default AccountVerified;
