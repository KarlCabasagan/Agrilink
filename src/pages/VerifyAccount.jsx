import { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { AuthContext } from "../App.jsx";
import supabase from "../SupabaseClient.jsx";

function VerifyAccount() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    async function checkVerification() {
      if (user) {
        if (user.email_confirmed_at || user.confirmed_at) {
          navigate("/", { replace: true });
          return;
        }
        const { data, error } = await supabase.auth.getUser?.();
        const freshUser = data?.user;
        if (
          freshUser &&
          (freshUser.email_confirmed_at || freshUser.confirmed_at)
        ) {
          navigate("/", { replace: true });
        }
      } else {
        const session = supabase.auth.getSession
          ? null
          : supabase.auth.session && supabase.auth.session();
        if (session && session.user) {
          navigate("/", { replace: true });
        }
      }
    }
    checkVerification();
    const interval = setInterval(checkVerification, 4000);
    return () => clearInterval(interval);
  }, [user, navigate]);

  return (
    <>
      <div className="min-h-screen min-w-screen flex items-center justify-center flex-col -translate-y-12">
        <Icon
          icon="mingcute:mail-line"
          width="200"
          height="200"
          color="var(--color-primary)"
        />
        <h2 className="text-2xl font-bold mt-4">Verify Your Email</h2>
        <p className="text-gray-600 mt-2">
          A verification link has been sent to your email address.
        </p>
      </div>
    </>
  );
}

export default VerifyAccount;
