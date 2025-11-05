import React, { useEffect, useRef, useState } from "react";
import "./class.css";
import { Table } from "../../components/table/table";
import { MdEdit, MdGroups, MdQrCodeScanner } from "react-icons/md";
import { FaCalendarCheck, FaDollarSign, FaPlus } from "react-icons/fa";
import { Modal, Popover, Button, QRCode } from "antd";
import { useNavigate } from "react-router-dom";
import { useGetClassQuery } from "../../context/service/class.service";
import { useGetCoinQuery } from "../../context/service/students.service";
import moment from "moment/moment";
import { useReactToPrint } from "react-to-print";

import {
  useAddDavomatMutation,
  useGetDavomatQuery,
} from "../../context/service/oquvchiDavomati.service";

const Class = () => {
  const navigate = useNavigate();
  const { data: classData = null } = useGetClassQuery();
  const { data: davomatData = null, refetch: davomatRefetch } =
    useGetDavomatQuery();

  const { data: studentData = [], refetch: studentRefetch } = useGetCoinQuery();
  const today = moment().format("DD-MM-YYYY");
  const [studentNames, setStudentNames] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStudentListModalOpen, setIsStudentListModalOpen] = useState(false);
  const [currentClass, setCurrentClass] = useState(null);
  const [crClassData, setCrClassData] = useState({});
  const [attendance, setAttendance] = useState({});
  const [addDavomat, { isLoading, isSuccess, error }] = useAddDavomatMutation();
  const schoolId = localStorage.getItem("school_id");
  const qrCodeRef = useRef(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const showQrModal = (studentId) => {
    const student = studentData?.find((stu) => stu._id === studentId);
    if (student) {
      setSelectedStudent(student);
      setIsQrModalOpen(true);
    }
  };

  const handleQrModalCancel = () => {
    setIsQrModalOpen(false);
    setSelectedStudent(null);
  };
  const showModal = (id) => {
    setIsModalOpen(true);
    setCurrentClass(id);
  };

  const handleOk = () => {
    setIsModalOpen(false);
    handleSubmit();
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setCurrentClass(null);
  };

  const showStudentListModal = (id) => {
    const selectedClass = classData?.find((classItem) => classItem._id === id);
    if (selectedClass) {
      setCrClassData(selectedClass);
      setIsStudentListModalOpen(true);
    }
  };
  const handlePrint = useReactToPrint({
    contentRef: qrCodeRef,
    documentTitle: "new document",
    pageStyle: "style",
  });

  useEffect(() => {
    const fetchStudentNames = async () => {
      const names = {};
      if (crClassData?.students) {
        const namePromises = crClassData.students.map(async (student) => {
          const name = await getStudentName(student);
          names[student] = name;
        });

        await Promise.all(namePromises);
        setStudentNames(names);
      }
    };

    fetchStudentNames();
  }, [crClassData]);

  useEffect(() => {
    if (classData && currentClass) {
      const data = classData?.find(
        (classItem) => classItem._id === currentClass
      );
      if (data) {
        setCrClassData(data);
      }
    }
  }, [classData, currentClass]);

  const handleAttendanceChange = (studentId, status) => {
    if (status === true || status === false) {
      setAttendance((prev) => ({
        ...prev,
        [studentId]: status,
      }));
    } else {
      console.error("Invalid status selection");
    }
  };

  const getStudentName = (id) => {
    const student = studentData?.find((student) => student._id === id);
    return student ? student.firstName + " " + student.lastName : "Loading...";
  };

  const handleSubmit = async () => {
    try {
      const formattedData = {
        date: today,
        schoolId: schoolId,
        body: {
          group_id: currentClass,
          students: crClassData?.students?.map((student) => ({
            student_id: student,
            status:
              attendance[student] !== undefined ? attendance[student] : false,
          })),
        },
      };

      await addDavomat(formattedData).unwrap();
      davomatRefetch();
    } catch (error) {
      console.error("Error submitting attendance:", error);
    }
  };

  return (
    <div className="page">
      <Modal
        title="Sinf davomati"
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        footer={[
          <Button key="back" onClick={handleCancel}>
            Bekor qilish
          </Button>,
          <Button key="submit" type="primary" onClick={handleOk}>
            Yuborish
          </Button>,
        ]}
      >
        <form>
          <Table>
            <thead>
              <tr>
                <th>O'quvchi ismi</th>
                <th>Holati</th>
              </tr>
            </thead>
            <tbody>
              {crClassData?.students?.map((student, index) => (
                <tr key={index}>
                  <td>{studentNames[student]}</td>
                  <td>
                    <input
                      type="radio"
                      name={`attendance-${student}`}
                      id={`keldi-${student}`}
                      checked={attendance[student] === true}
                      onChange={() => handleAttendanceChange(student, true)} // true -> Keldi
                    />
                    <label htmlFor={`keldi-${student}`}>Keldi</label>

                    <input
                      type="radio"
                      name={`attendance-${student}`}
                      id={`kelmadi-${student}`}
                      checked={attendance[student] === false}
                      onChange={() => handleAttendanceChange(student, false)} // false -> Kelmadi
                    />
                    <label htmlFor={`kelmadi-${student}`}>Kelmadi</label>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </form>
      </Modal>

      <Modal
        title="Sinfdagi o'quvchilar"
        open={isStudentListModalOpen}
        onCancel={() => setIsStudentListModalOpen(false)}
        footer={[]}
      >
        <Table>
          <thead>
            <tr>
              <th>O'quvchi ismi</th>
            </tr>
          </thead>
          <tbody>
            {crClassData?.students?.map((student, index) => (
              <tr key={index}>
                <td>
                  <span>{studentNames[student]}</span>
                  <button
                    style={{
                      color: "#fff",
                      fontSize: "20px",
                      marginLeft: "12px",
                    }}
                    onClick={() => showQrModal(student)}
                  >
                    <MdQrCodeScanner />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Modal>
      <Modal
        title={`QR kod - ${selectedStudent?.firstName} ${selectedStudent?.lastName}`}
        open={isQrModalOpen}
        onCancel={handleQrModalCancel}
        footer={[
          <Button key="close" onClick={handleQrModalCancel}>
            Yopish
          </Button>,
          <Button key="print" type="primary" onClick={handlePrint}>
            Chop etish
          </Button>,
        ]}
      >
        {selectedStudent && (
          <div
            ref={qrCodeRef}
            style={{ width: "100%", justifyContent: "center", display: "flex" }}
            className="qrbox"
          >
            <QRCode renderAs="svg" value={selectedStudent._id} />
            <p>
              {selectedStudent.firstName.charAt(0).toUpperCase() +
                selectedStudent.firstName.slice(1)}{" "}
              {selectedStudent.lastName.charAt(0).toUpperCase() +
                selectedStudent.lastName.slice(1)}
            </p>
          </div>
        )}
      </Modal>

      <div className="page-header">
        <h1>Sinflar</h1>
        <div className="log-header">
          <p>
            <i>Umumiy sinflar:</i>
            <span>{classData?.length || 0}</span>
          </p>
          <Button typ onClick={() => navigate("/addclass")}>
            <FaPlus />
          </Button>
        </div>
      </div>

      <Table>
        <thead>
          <tr>
            <th>№</th>
            <th>Sinf rahbari</th>
            <th>Sinf</th>
            <th>Sinf raqami</th>
            <th>O'quvchi soni</th>
            <th>Amallar</th>
          </tr>
        </thead>
        <tbody>
          {classData?.map((item, index) => (
            <tr key={item._id}>
              <td>{index + 1}</td>
              <td>
                {item.teacher ? (
                  item.teacher?.firstName + " " + item.teacher?.lastName
                ) : (
                  <Popover placement="bottom" content="O'qituvchi tayinlash">
                    <button>
                      <FaPlus />
                    </button>
                  </Popover>
                )}
              </td>
              <td>{item.name}</td>
              <td>{item.number}</td>
              <td>{item.students.length}</td>
              <td>
                <Popover placement="bottom" content="O'quvchilarni ko'rish">
                  <button onClick={() => showStudentListModal(item._id)}>
                    <MdGroups />
                  </button>
                </Popover>
                <Popover placement="bottom" content="Davomat olish">
                  <button
                    onClick={() => showModal(item._id)}
                    disabled={(() => {
                      const todayDavomat = davomatData?.find(
                        (davomat) =>
                          davomat.date === today &&
                          davomat.body.some(
                            (group) => group.group_id === item._id
                          )
                      );
                      return todayDavomat ? true : false;
                    })()}
                  >
                    <FaCalendarCheck />
                  </button>
                </Popover>

                <Popover placement="bottom" content="Tahrirlash">
                  <button onClick={() => navigate(`/addclass/${item._id}`)}>
                    <MdEdit />
                  </button>
                </Popover>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default Class;
