import { createContext, useContext } from "react";

export const NavigationLayoutContext = createContext({
    isPersistentLayoutActive: false,
});

export const useNavigationLayout = () => useContext(NavigationLayoutContext);
