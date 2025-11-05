import React, { memo } from "react";
import "./login.css";
import { useSignInAdminMutation } from "../../context/service/admin.service";
import { enqueueSnackbar as EnSn } from "notistack";
import { useNavigate } from "react-router-dom";

export const Login = memo(() => {
  const navigate = useNavigate();
  const [signInAdmin] = useSignInAdminMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    let value, msg, variant;
    value = Object.fromEntries(new FormData(e.target));
    const { data = null, error = null } = await signInAdmin(value);
    if (error) {
      msg = "Login yoki parol noto'g'ri, iltimos qaytadan kiriting";
      variant = "error";
      return EnSn(msg, { variant });
    } else {
      localStorage.setItem("access_token", data?.token);
      localStorage.setItem("school_id", data?.id);
      localStorage.setItem("role", data?.role);
      window.location.reload();
    }
  };

  return (
    <div className="login">
      <form className="login-form" onSubmit={handleSubmit}>
        <h1>STANFORD</h1>
        <label>
          <span>Login</span>
          <input
            type="text"
            placeholder="login kriting"
            autoComplete="off"
            autoFocus
            name="login"
          />
        </label>

        <label>
          <span>Password</span>
          <input
            type="password"
            placeholder="password kriting"
            name="password"
          />
        </label>

        <label>
          <input type="submit" value="Kirish" />
        </label>
      </form>
    </div>
  );
});
