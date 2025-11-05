import { Button, Input, message, Select } from "antd";
import React, { useState } from "react";
import { useGetTeachersQuery } from "../../context/service/teacher.service";
import moment from "moment/moment";
import { useCreateExchangeMutation } from "../../context/service/oylikberish.service";
import { useNavigate } from "react-router-dom";

const { Option } = Select;

const DarsAlmashish = () => {
  const { data = null } = useGetTeachersQuery();
  const [sickTeacher, setSickTeacher] = useState(null);
  const [teachingTeacher, setTeachingTeacher] = useState(null);
  const [lessonCount, setLessonCount] = useState(1);
  const navigate = useNavigate();
  const [createExchange] = useCreateExchangeMutation();

  const handleSickTeacherChange = (value) => {
    setSickTeacher(value);
  };

  const handleTeachingTeacherChange = (value) => {
    setTeachingTeacher(value);
  };

  function submitFunction() {
    if (window.confirm("Kiritilgan ma'lumotlar to'g'rimi?")) {
      const body = {
        sickTeacherId: sickTeacher,
        teachingTeacherId: teachingTeacher,
        lessonCount: lessonCount,
        month: moment().format("MM-YYYY"),
        createdAt: moment().format("DD-MM-YYYY HH:mm"),
      };

      createExchange(body)
        .unwrap()
        .then((response) => {
          message.success("Dars almashish muvaffaqiyatli amalga oshirildi");
          navigate("/teacher");
        })
        .catch((error) => {
          console.error("Failed to create exchange:", error);
          message.success("Dars almashishda xatolik yuz berdi");
        });
    } else {
      return;
    }
  }

  return (
    <div className="page" style={{ gap: "8px" }}>
      <h1>O'qituvchini almashtirish</h1>
      <Select
        placeholder="Kelmay qolgan o'qituvchi"
        value={sickTeacher}
        onChange={handleSickTeacherChange}
        style={{ width: "100%", height: "40px" }}
      >
        <Option disabled={sickTeacher === null} value={""}>
          Tanlash
        </Option>

        {data?.map((item) => (
          <Option
            key={item._id}
            value={item._id}
            disabled={item._id === teachingTeacher}
          >
            {item.firstName + " " + item.lastName}
          </Option>
        ))}
      </Select>
      {sickTeacher && (
        <span style={{ color: "red" }}>
          -
          {(
            data.find((t) => t._id === sickTeacher).price * lessonCount
          ).toLocaleString()}{" "}
        </span>
      )}
      <Select
        placeholder="O'rniga o'tadigan o'qituvchi"
        value={teachingTeacher}
        onChange={handleTeachingTeacherChange}
        style={{ width: "100%", height: "40px" }}
      >
        <Option disabled={teachingTeacher === null} value={""}>
          Tanlash
        </Option>
        {data?.map((item) => (
          <Option
            key={item._id}
            value={item._id}
            disabled={item._id === sickTeacher}
          >
            {item.firstName + " " + item.lastName}
          </Option>
        ))}
      </Select>
      {teachingTeacher && (
        <span style={{ color: "green" }}>
          +
          {(
            data.find((t) => t._id === teachingTeacher).price * lessonCount
          ).toLocaleString()}{" "}
        </span>
      )}
      <p>Dars soni</p>
      <Input
        autoComplete="off"
        value={lessonCount}
        onChange={(e) => setLessonCount(Number(e.target.value))}
        placeholder="Dars soni"
        style={{ width: "100%", height: "40px" }}
        type="number"
        min={1}
      />
      <Button
        disabled={!sickTeacher || !teachingTeacher}
        style={{ width: "120px", height: "40px" }}
        type="primary"
        onClick={() => submitFunction()}
      >
        Yuborish
      </Button>
    </div>
  );
};

export default DarsAlmashish;
