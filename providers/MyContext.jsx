import React, { createContext, useState } from "react";

export const UserContext = createContext();
export const ModalContext = createContext();

export const ContextProvider = ({ children }) => {
  const [user, setUser] = useState();
  const [isOpenedModal, setIsOpenedModal] = useState(false);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      <ModalContext.Provider value={{ isOpenedModal, setIsOpenedModal }}>
        {children}
      </ModalContext.Provider>
    </UserContext.Provider>
  );
};
