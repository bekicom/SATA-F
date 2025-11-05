import React, { useEffect, useState } from "react";
import { FaChevronLeft } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import {
  useAddClassMutation,
  useGetClassQuery,
  useUpdateClassMutation,
} from "../../context/service/class.service";
import { useGetTeachersQuery } from "../../context/service/teacher.service";
import { Button, Input } from "antd";
const AddClass = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // URL dan sinf ID ni olish
  const [addClass, { isLoading: isAdding }] = useAddClassMutation();
  const { data = [] } = useGetClassQuery();
  const [updateClass, { isLoading: isUpdating }] = useUpdateClassMutation();
  const { data: carData = null } = useGetTeachersQuery();
  const [classNumber, setClassNumber] = useState("1");
  const [className, setClassName] = useState("");
  const [teacher, setTeacher] = useState(null);
  const schoolId = localStorage.getItem("school_id");
  const isEditing = !!id; // ID mavjudligini tekshirish
  const [editingClass, setEditingClass] = useState({});

  useEffect(() => {
    if (carData && carData.length > 0) {
      setTeacher(carData[0]._id);
    }
  }, [carData]);

  useEffect(() => {
    const fetchClassData = async () => {
      if (isEditing) {
        try {
          const findClass = await data.find((student) => student._id === id);

          setEditingClass(findClass);
          setClassNumber(findClass?.number);
          setClassName(findClass?.name);
          setTeacher(findClass?.teacher._id);
        } catch (error) {
          console.error("Error fetching class data:", error);
        }
      }
    };

    fetchClassData();
  }, [id]);

  const numbers = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"];

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      name: className,
      number: classNumber,
      teacher,
      schoolId,
    };

    try {
      if (isEditing) {
        await updateClass({ group_id: id, ...payload }).unwrap();
      } else {
        await addClass(payload).unwrap();
      }
      navigate("/class");
      window.location.reload();
    } catch (err) {
      console.error("Xatolik:", err);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>{!isEditing ? "Sinf qo'shish" : "Sinfni tahrirlash"}</h1>
        <Button type="primary" onClick={() => navigate("/class")}>
          <FaChevronLeft />
        </Button>
      </div>
      <form className="form_body" onSubmit={handleSubmit}>
        <label htmlFor="classNumber">
          <p>Sinf raqami</p>
          <select
            id="classNumber"
            value={classNumber}
            onChange={(e) => setClassNumber(e.target.value)}
          >
            {numbers.map((number) => (
              <option key={number} value={number}>
                {number}
              </option>
            ))}
          </select>
        </label>

        <label htmlFor="className">
          <p>Sinf nomi (ixtiyoriy)</p>
          <input
            type="text"
            id="className"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            placeholder="Sinf nomini kiriting"
          />
        </label>

        <label htmlFor="teacher">
          <p>O'qituvchi</p>
          <select id="teacher" onChange={(e) => setTeacher(e.target.value)}>
            {carData?.map((item) => (
              <option
                key={item._id}
                selected={item._id === teacher}
                value={item._id}
                disabled={
                  item.classLeader === editingClass?.classLeader
                    ? false
                    : item.classLeader !== ""
                }
              >
                {item.firstName + " " + item.lastName}
              </option>
            ))}
          </select>
        </label>

        <button type="submit" disabled={isAdding || isUpdating}>
          {isAdding || isUpdating
            ? "Yuklanmoqda..."
            : !isEditing
            ? "Qo'shish"
            : "Yangilash"}
        </button>
      </form>
    </div>
  );
};

export default AddClass;
