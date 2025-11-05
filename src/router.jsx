import React, { memo } from "react";
import { Routes, Route } from "react-router-dom";
import { Layout } from "./layout/layout";
import { Login } from "./pages/auth/login";

import Home from "./pages/home/home";
import Class from "./pages/class/class";
//
import Teacher from "./pages/teachers/teacher";
import AddTeacher from "./pages/teachers/addteacher";
import AddClass from "./pages/class/addclass";
import Student from "./pages/students/students";
import AddStudent from "./pages/students/addstudent";
import Davomat from "./pages/davomat/davomat";
import Oylikberish from "./pages/oylikberish/oylikberish";
import { Payment } from "./pages/payment/payment";
import CreatePayment from "./pages/payment/createPayment";
import AddHarajat from "./pages/harajat/addharajat";
import Harajat from "./pages/harajat/harajat";
import { MaoshHisobot } from "./pages/maoshHisobot/maoshHisobot";
import DarsAlmashish from "./pages/darsAlmashish/darsAlmashish";
import { Debt } from "./pages/payment/debt";
import TeacherDavomat from "./pages/teacherDavomat/teacherDavomat";
import AddTeacherDavomat from "./pages/teacherDavomat/addTeacherDavomat";
import PaymentLog from "./pages/payment/paymentLog";
import Fan from "./pages/Fan/Fan";
import Darsjadval from "./pages/DarsJadval/Darsjadval";
//
const NotFound = () => <h1>404</h1>;

export const Routera = memo(() => {
  const token = localStorage.getItem("access_token");
  const role = localStorage.getItem("role");
  return token ? (
    <Routes>
      <Route
        path="/"
        element={role === "teacher" ? <TeacherDavomat /> : <Layout />}
      >
        <Route index element={<Home />} />
        <Route path="class" element={<Class />} />
        <Route path="teacher" element={<Teacher />} />
        <Route path="student" element={<Student />} />
        <Route path="addstudent" element={<AddStudent />} />
        <Route path="addstudent/:id" element={<AddStudent />} />
        <Route path="addteacher" element={<AddTeacher />} />
        <Route path="addteacher/:id" element={<AddTeacher />} />
        <Route path="addclass" element={<AddClass />} />
        <Route path="addclass/:id" element={<AddClass />} />
        <Route path="davomat" element={<Davomat />} />
        <Route path="davomat/teacher" element={<TeacherDavomat />} />
        <Route path="davomat/teacher/handle" element={<AddTeacherDavomat />} />
        <Route path="oylik" element={<Oylikberish />} />
        <Route path="payment" element={<Payment />} />
        <Route path="payment/log" element={<PaymentLog />} />
        <Route path="fan" element={<Fan />} />
        <Route path="drasjadval" element={<Darsjadval />} />
        <Route path="debtor" element={<Debt />} />
        <Route path="payment/create" element={<CreatePayment />} />
        <Route path="harajat" element={<Harajat />} />
        <Route path="hisobot" element={<MaoshHisobot />} />
        <Route path="change" element={<DarsAlmashish />} />
        <Route path="harajat/create" element={<AddHarajat />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  ) : (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
});
