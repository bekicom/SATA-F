import React, { useEffect, useRef } from "react";
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

export const WebSocketProvider = ({ children }) => {
  const wsRef = useRef(null);

  const [addTeacherDavomat] = useAddTeacherDavomatMutation();
  const [addStudentDavomat] = useAddDavomatByScanMutation();

  const { data: teachers = [] } = useGetTeachersQuery();
  const { data: students = [] } = useGetCoinQuery();

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
              await addTeacherDavomat({
                employeeNo: teacher.employeeNo,
                davomatDate: moment(dateIso).format("YYYY-MM-DD"),
                status: "keldi",
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
  }, [teachers, students, addTeacherDavomat, addStudentDavomat]);

  return <>{children}</>;
};
