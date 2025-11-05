import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./assets/global.css";
import "./assets/modal.css";
import { Routera } from "./router";
import { Provider } from "react-redux";
import { SnackbarProvider } from "notistack";
import { Loading } from "./components/loading/loading";
import store from "./context/store";
import { WebSocketProvider } from "./components/WebSocketProvider"; // Bu faylni yaratishimiz kerak

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <BrowserRouter>
    <Provider store={store}>
      <SnackbarProvider>
        <WebSocketProvider>
          <Loading />
          <Routera />
        </WebSocketProvider>
      </SnackbarProvider>
    </Provider>
  </BrowserRouter>
);
