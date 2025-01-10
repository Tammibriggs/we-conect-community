import { configureAxios } from "./axiosInstance";

const signIn = async (username, setUser) => {
  const axiosInstance = configureAxios(setUser);

  try {
    setUser(undefined);
    const res = await axiosInstance.post("/auth/signin", {
      username,
    });
    const { user, accessToken } = res.data;
    sessionStorage.setItem("token", accessToken);
    sessionStorage.setItem("user", JSON.stringify(user));
    setUser(user);
  } catch (err) {
    setUser(null);
  }
};

export { signIn };
