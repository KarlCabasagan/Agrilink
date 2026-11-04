import { createContext, useContext } from "react";

export const AuthContext = createContext({
    user: null,
    setUser: () => {},
    userRole: null,
    setUserRole: () => {},
});

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
