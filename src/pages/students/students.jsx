import React, { useState, useEffect } from "react";
import { Table, Popover, Input, Button, message, Select, Modal } from "antd";
import { MdDelete, MdEdit, MdQrCode } from "react-icons/md";
import { FaDownload, FaPlus } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import {
  useDeleteStudentMutation,
  useGetCoinQuery,
  useUpdateStudentStatusMutation,
} from "../../context/service/students.service";
import moment from "moment";
import { Loading } from "../../components/loading/loading";
import { useGetClassQuery } from "../../context/service/class.service";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { QRCodeCanvas } from "qrcode.react";

const { Search } = Input;

const Student = () => {
  const navigate = useNavigate();
  const { data: classes = [] } = useGetClassQuery();
  const {
    data: students = [],
    error: fetchError,
    isLoading: fetchLoading,
    refetch,
  } = useGetCoinQuery();

  const [deleteStudent] = useDeleteStudentMutation();
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedClass, setSelectedClass] = useState("");

  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [updateStudentStatus] = useUpdateStudentStatusMutation();

  useEffect(() => {
    const sortedStudents = students
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    setFilteredStudents(sortedStudents);
  }, [students]);

  const handleDelete = async (id) => {
    if (!window.confirm("Rostan ham o'quvchini o'chirmoqchimisiz?")) return;
    try {
      await deleteStudent(id);
      message.success("O'quvchi o'chirildi");
      refetch();
    } catch (error) {
      console.error("Error deleting student:", error);
      message.error("O'quvchini o'chirishda xatolik");
    }
  };
  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await updateStudentStatus({ id, isActive: !currentStatus });
      message.success(
        currentStatus
          ? "O‘quvchi faolsizlantirildi"
          : "O‘quvchi faollashtirildi"
      );
      refetch();
    } catch (error) {
      console.error("Status o‘zgartirishda xato:", error);
      message.error("Statusni o‘zgartirishda xatolik yuz berdi");
    }
  };

  useEffect(() => {
    if (selectedClass) {
      setFilteredStudents(
        students.filter((st) => st.groupId._id === selectedClass)
      );
    } else {
      setFilteredStudents(students);
    }
  }, [selectedClass, students]);

  const handleSearch = (value) => {
    const filtered = students.filter((student) =>
      (student.firstName + " " + student.lastName)
        .toLowerCase()
        .includes(value.toLowerCase())
    );
    setFilteredStudents(filtered);
  };

  const handleTableChange = (pagination) => {
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);
  };

  const handlePrint = () => {
    const content = document.querySelector(".qr-code-container").innerHTML;
    const printWindow = window.open("", "_blank", "width=600,height=400");
    printWindow.document.write(`
      <html>
        <head><title>QR Kod</title></head>
        <body style="text-align:center;">
          ${content}
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function () {
                window.close();
              };
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

 const columns = [
   {
     title: "№",
     key: "index",
     render: (text, record, index) => (currentPage - 1) * pageSize + index + 1,
   },
   {
     title: "FISH",
     dataIndex: "firstName",
     key: "firstName",
     render: (text, record) => `${record.firstName} ${record.lastName}`,
   },
   {
     title: "ID (employeeNo)",
     dataIndex: "employeeNo",
     key: "employeeNo",
   },
   {
     title: "Sinf",
     dataIndex: "groupId",
     key: "groupId",
     render: (group) => group?.name,
   },
   {
     title: "Oylik to'lov",
     dataIndex: "monthlyFee",
     key: "monthlyFee",
     render: (text) => text.toLocaleString() + " so'm",
   },
   {
     title: "Tug'ilgan sana",
     dataIndex: "birthDate",
     key: "birthDate",
     render: (date) => moment(date).format("DD-MM-YYYY"),
   },
   {
     title: "Telefon raqam",
     dataIndex: "phoneNumber",
     key: "phoneNumber",
   },
   {
     title: "Ota onasining tel.",
     dataIndex: "guardianPhoneNumber",
     key: "guardianPhoneNumber",
   },
   {
     title: "Jinsi",
     dataIndex: "gender",
     key: "gender",
   },
   {
     title: "Seriya",
     dataIndex: "passportNumber",
     key: "passportNumber",
   },
   {
     title: "Holati",
     dataIndex: "isActive",
     key: "isActive",
     render: (isActive, record) => (
       <Button
         type={isActive ? "primary" : "default"}
         danger={!isActive}
         onClick={() => handleToggleStatus(record._id, isActive)}
         style={{
           backgroundColor: isActive ? "#52c41a" : "#f5222d",
           borderColor: isActive ? "#52c41a" : "#f5222d",
           color: "#fff",
           fontWeight: 600,
         }}
       >
         {isActive ? "Faol" : "Faol emas"}
       </Button>
     ),
   },
   {
     title: "Amallar",
     key: "actions",
     render: (text, record) => (
       <>
         <Popover content="Tahrirlash" placement="bottom">
           <Button
             onClick={() => navigate(`/addstudent/${record._id}`)}
             type="primary"
           >
             <MdEdit />
           </Button>
         </Popover>
         <Popover content="QR kod" placement="bottom">
           <Button
             type="default"
             style={{ margin: "0 4px" }}
             onClick={() => {
               setSelectedStudent(record);
               setSelectedStudentId(record._id);
               setQrModalVisible(true);
             }}
           >
             <MdQrCode />
           </Button>
         </Popover>
         <Popover content="O'chirish" placement="bottom">
           <Button
             onClick={() => handleDelete(record._id)}
             type="primary"
             danger
           >
             <MdDelete />
           </Button>
         </Popover>
       </>
     ),
   },
 ];


  function downloadExcel() {
    const titleRow = [
      "F.I.SH",
      "ID (employeeNo)",
      "Sinf",
      "Oylik to'lov",
      "Tug'ilgan sana",
      "Telefon raqam",
      "Ota onasining tel.",
      "Jinsi",
      "Seriya",
    ];

    const worksheetData = filteredStudents.map((record) => [
      `${record.firstName} ${record.lastName}`,
      record.employeeNo,
      record.groupId.name,
      record.monthlyFee,
      moment(record.birthDate).format("DD-MM-YYYY"),
      record.phoneNumber,
      record.guardianPhoneNumber,
      record.gender,
      record.passportNumber,
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet([titleRow, ...worksheetData]);

    worksheet["!cols"] = [
      { wch: 20 },
      { wch: 15 },
      { wch: 10 },
      { wch: 12 },
      { wch: 15 },
      { wch: 15 },
      { wch: 18 },
      { wch: 10 },
      { wch: 15 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "O'quvchilar");
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const dataBlob = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });
    saveAs(dataBlob, "oquvchilar.xlsx");
  }

  if (fetchLoading) return <Loading />;
  if (fetchError) return <div>O'quvchilarni olishda xato yuz berdi</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>O'quvchilar</h1>
        <div className="page-header__actions">
          <Select
            placeholder="Sinfni tanlang"
            onChange={(value) => setSelectedClass(value)}
            value={selectedClass}
          >
            <Select.Option value="">Barcha sinf</Select.Option>
            {classes.map((c) => (
              <Select.Option key={c._id} value={c._id}>
                {c.name}
              </Select.Option>
            ))}
          </Select>
          <Search
            placeholder="Ism bo'yicha qidiruv"
            onSearch={handleSearch}
            enterButton
            style={{ width: "300px" }}
          />
          <Button type="primary" onClick={() => navigate("/addstudent")}>
            <FaPlus /> O'quvchi qo'shish
          </Button>
          <Button type="primary" onClick={downloadExcel}>
            <FaDownload /> Excel yuklash
          </Button>
        </div>
      </div>

      <Table
        dataSource={filteredStudents}
        columns={columns}
        rowKey="_id"
        pagination={{ current: currentPage, pageSize: pageSize }}
        onChange={handleTableChange}
        loading={fetchLoading}
      />

      <Modal
        title="O'quvchi QR kodi"
        open={qrModalVisible}
        onCancel={() => setQrModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setQrModalVisible(false)}>
            Yopish
          </Button>,
          <Button key="print" type="primary" onClick={handlePrint}>
            Print
          </Button>,
        ]}
      >
        <div className="qr-code-container" style={{ textAlign: "center" }}>
          <QRCodeCanvas value={selectedStudentId} size={160} />
          <div style={{ marginTop: "12px" }}>
            <p>
              {selectedStudent?.firstName} {selectedStudent?.lastName}
            </p>
            <p>ID: {selectedStudent?.employeeNo}</p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Student;
