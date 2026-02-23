import React, { useCallback, useEffect, useRef } from "react";
import { message } from "antd";
import moment from "moment";

// TEACHER
import {
  useAddTeacherDavomatMutation,
  useGetTeachersQuery,
} from "../context/service/teacher.service";

// STUDENT
import { useAddDavomatByScanMutation } from "../context/service/oquvchiDavomati.service";
import { useGetCoinQuery } from "../context/service/students.service";

const UZB_WEEK = {
  1: "dushanba",
  2: "seshanba",
  3: "chorshanba",
  4: "payshanba",
  5: "juma",
  6: "shanba",
  0: "yakshanba",
};

export const WebSocketProvider = ({ children }) => {
  const wsRef = useRef(null);

  const [addTeacherDavomat] = useAddTeacherDavomatMutation();
  const [addStudentDavomat] = useAddDavomatByScanMutation();

  const { data: teachers = [] } = useGetTeachersQuery();
  const { data: students = [] } = useGetCoinQuery();

  const getTeacherDailySum = useCallback((teacher, dateIso) => {
    const dayKey = UZB_WEEK[moment(dateIso).day()];
    const daySchedule = Number(teacher?.schedule?.[dayKey] || 0);
    const price = Number(teacher?.price || 0);
    return daySchedule * price;
  }, []);

  useEffect(() => {
    const connectWebSocket = () => {
      const ws = new WebSocket("wss://satacamera.richman.uz");
      wsRef.current = ws;

      ws.onopen = () => console.log("✅ WS: ulandi");

      ws.onmessage = async (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg?.type !== "client_message") return;

          // ⚠️ Ba’zi hollarda payload ichida yana payload bo‘ladi
          const raw = msg?.payload?.payload || msg?.payload || {};
          const employeeNo = (raw?.employeeNo ?? "").toString().trim();

          const dateIso =
            raw?.datetime ||
            raw?.dateTime ||
            msg?.payload?.timestamp ||
            new Date().toISOString();

          if (!employeeNo) return;

          const schoolId = localStorage.getItem("school_id");
          if (!schoolId) {
            message.error("❌ Tizimga qayta kiring (SchoolId yo‘q)");
            return;
          }

          let handled = false;

          // === TEACHER ===
          const teacher = teachers.find(
            (t) => String(t.employeeNo).trim() === employeeNo
          );
          if (teacher) {
            try {
              const davomatDate = moment(dateIso).format("YYYY-MM-DD");
              const summ = getTeacherDailySum(teacher, dateIso);

              await addTeacherDavomat({
                teacherId: teacher._id,
                employeeNo: teacher.employeeNo,
                davomatDate,
                status: "keldi",
                summ,
              }).unwrap();

              if (!handled) {
                message.success(
                  `✅ O‘qituvchi davomati: ${teacher.firstName} ${teacher.lastName}`
                );
                handled = true;
              }
              return;
            } catch (err) {
              console.error("Teacher davomat xato:", err);
              message.error(
                `❌ O‘qituvchi davomati xato: ${
                  err?.data?.message || err?.message || "Noma’lum"
                }`
              );
              return;
            }
          }

          // === STUDENT ===
          const student = students.find(
            (s) => String(s.employeeNo).trim() === employeeNo
          );
          if (student) {
            try {
              await addStudentDavomat({
                employeeNo: student.employeeNo,
                davomatDate: moment(dateIso).format("YYYY-MM-DD"),
                status: true,
              }).unwrap();

              if (!handled) {
                message.success(
                  `✅ Talaba davomati: ${student.firstName} ${student.lastName}`
                );
                handled = true;
              }
              return;
            } catch (err) {
              console.error("Student davomat xato:", err);
              message.error(
                `❌ Talaba davomati xato: ${
                  err?.data?.message || err?.message || "Noma’lum"
                }`
              );
              return;
            }
          }
        } catch (e) {
          console.error("❌ WS parse xato:", e);
        }
      };

      ws.onclose = () => {
        console.log("🔌 WS yopildi. Qayta ulanish...");
        setTimeout(connectWebSocket, 3000);
      };
    };

    connectWebSocket();
    return () => wsRef.current?.close();
  }, [
    teachers,
    students,
    addTeacherDavomat,
    addStudentDavomat,
    getTeacherDailySum,
  ]);

  return <>{children}</>;
};
