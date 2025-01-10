import { ContextProvider } from "@/providers/MyContext";
import "@/styles/globals.css";
import { StyledEngineProvider } from "@mui/material";
import { ToastContainer } from "react-toastify";

export default function App({ Component, pageProps }) {
  return (
    <StyledEngineProvider injectFirst>
      <ContextProvider>
        <Component {...pageProps} />
        <ToastContainer />
      </ContextProvider>
    </StyledEngineProvider>
  );
}
