import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import scanGif from "../../assets/qr_gif.gif";
import loadingGif from "../../assets/loading.gif";
import { message } from "antd";
import {
  useAddTeacherDavomatMutation,
  useGetTeachersQuery,
} from "../../context/service/teacher.service";
import moment from "moment";

const AddTeacherDavomatByScan = () => {
  const [loading, setLoading] = useState(false);
  const [teacherData, setTeacherData] = useState(null);
  const inputRef = useRef();
  const [addTeacherDavomat, { isLoading }] = useAddTeacherDavomatMutation();
  const { data: teachers = [] } = useGetTeachersQuery();

  useLayoutEffect(() => {
    if (inputRef?.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleScanSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const teacherId = e.target[0].value.trim();
      if (!teacherId) {
        message.error("Teacher ID kiritilmadi");
        setLoading(false);
        return;
      }

      const teacher = fetchTeacherData(teacherId);

      if (!teacher) {
        message.error("O'qituvchi topilmadi");
        setLoading(false);
        return;
      }

      const todayInWeek = moment().day();
      const uzbWeek = {
        1: "dushanba",
        2: "seshanba",
        3: "chorshanba",
        4: "payshanba",
        5: "juma",
        6: "shanba",
        7: "yakshanba",
      };
      const daySchedule = teacher.schedule[uzbWeek[todayInWeek]] || 0;
      const summ = teacher.price * daySchedule;

      await addTeacherDavomat({
        teacherId: teacher._id,
        davomatDate: moment().format("DD-MM-YYYY"),
        status: true,
        summ,
      }).unwrap();

      message.success("Davomat olindi!");
      setTeacherData(teacher);
      setTimeout(() => {
        setTeacherData(null);
        if (inputRef?.current) {
          inputRef.current.focus();
        }
      }, 3000);
    } catch (err) {
      message.error("Xatolik yuz berdi!");
    } finally {
      setLoading(false);
    }
  };

  const fetchTeacherData = (teacherId) => {
    return teachers.find((teacher) => teacher._id === teacherId) || null;
  };

  return (
    <div className="page" style={{ background: "#fff" }}>
      <div className="page-header">
        <h1>O'qituvchi uchun davomat olish</h1>
      </div>
      <form
        onSubmit={handleScanSubmit}
        className="page-body"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        {loading ? (
          <img style={{ width: "30vw" }} src={loadingGif} alt="loading" />
        ) : teacherData ? (
          <div style={{ textAlign: "center" }}>
            <h3>Davomat saqlandi</h3>
            <p>
              <strong>O'qituvchi:</strong> {teacherData.firstName}{" "}
              {teacherData.lastName}
            </p>
            <p>
              <strong>Sana:</strong> {moment().format("DD-MM-YYYY")}
            </p>
          </div>
        ) : (
          <>
            <input
              type="text"
              style={{ width: "30%", height: "40px", paddingInline: "12px" }}
              placeholder="Skaner qilingan ma'lumot"
              ref={inputRef}
            />
            <img style={{ width: "30vw" }} src={scanGif} alt="gif" />
            <p>QR kodni skanerga ko'rsating</p>
          </>
        )}
      </form>
    </div>
  );
};

export default AddTeacherDavomatByScan;
