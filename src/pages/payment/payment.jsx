import React, { useEffect, useState } from "react";
import "./payment.css";
import { useGetPaymentQuery } from "../../context/service/payment.service";
import { Table } from "../../components/table/table";
import moment from "moment";
import { FaList, FaPlus } from "react-icons/fa";
import { Button, DatePicker, Input, Select } from "antd";
import { useNavigate } from "react-router-dom";
import { useGetClassQuery } from "../../context/service/class.service";

const { Search } = Input;
const { Option } = Select;

export const Payment = () => {
  const { data = null } = useGetPaymentQuery();
  const { data: groupData = [] } = useGetClassQuery();
  const [filteredPayments, setFilteredPayments] = useState([]);
  const today = moment().format("MM-YYYY");
  const [selectedMonth, setSelectedMonth] = useState(today);
  const [viewType, setViewType] = useState("monthly");
  const [selectedClass, setSelectedClass] = useState(null);
  const navigate = useNavigate();
  const { data: classData = [] } = useGetClassQuery();

  useEffect(() => {
    if (data) {
      // 🔹 Filter payments by class
      let payments = data;
      if (selectedClass) {
        payments = payments.filter(
          (payment) => payment.user_groupId === selectedClass
        );
      }
      setFilteredPayments(payments);
    } else {
      setFilteredPayments([]);
    }
  }, [data, selectedClass]);

  const handleSearch = (value) => {
    const filtered = data.filter((payment) =>
      payment.user_fullname.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredPayments(filtered);
  };

  const handleViewTypeChange = (value) => {
    setViewType(value);
  };

  const handleClassChange = (value) => {
    setSelectedClass(value);
  };

  const getTotalPayment = () => {
    let total = 0;

    if (Array.isArray(filteredPayments)) {
      filteredPayments.forEach((payment) => {
        if (viewType === "monthly") {
          if (payment.payment_month === selectedMonth) {
            total += payment.payment_quantity;
          }
        } else if (viewType === "daily") {
          const paymentDate = moment(payment.createdAt).format("YYYY-MM-DD");
          const today = moment().format("YYYY-MM-DD");
          if (paymentDate === today) {
            total += payment.payment_quantity;
          }
        }
      });
    }

    return total;
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>To'lovlar</h1>
        <div className="page-header__actions">
          <Search
            placeholder="Ism bo'yicha qidiruv"
            onChange={(e) => handleSearch(e.target.value)}
            enterButton
            style={{ width: "300px", marginRight: "10px" }}
          />
          <DatePicker
            onChange={(date, dateString) => {
              if (dateString) {
                setSelectedMonth(dateString);
              } else {
                setSelectedMonth(today);
              }
            }}
            format="MM-YYYY"
            picker="month"
            placeholder="Oy"
            required
          />
          <Select
            defaultValue={viewType}
            style={{ width: 120, marginRight: "10px" }}
            onChange={handleViewTypeChange}
          >
            <Option value="monthly">Oylik</Option>
            <Option value="daily">Kunlik</Option>
          </Select>

          <Select
            placeholder="Sinfni tanlash"
            style={{ width: 180, marginRight: "10px" }}
            onChange={handleClassChange}
          >
            {classData?.map((classItem) => (
              <Option key={classItem._id} value={classItem._id}>
                {classItem.name}
              </Option>
            ))}
          </Select>

          <Button type="primary" onClick={() => navigate("log")}>
            <FaList />
          </Button>
          <Button type="primary" onClick={() => navigate("create")}>
            <FaPlus />
          </Button>
        </div>
      </div>

      <Table>
        <thead>
          <tr>
            <th>№</th>
            <th>To'liq ismi</th>
            <th>Sinfi</th>
            <th>To'lov summasi</th>
            <th>To'lov oyi</th>
            <th>To'lov sanasi</th>
            <th>To'lov turi</th>
          </tr>
        </thead>
        <tbody>
          {filteredPayments
            ?.filter((item) => {
              if (viewType === "monthly") {
                return item.payment_month === selectedMonth;
              } else if (viewType === "daily") {
                const paymentDate = moment(item.createdAt).format("YYYY-MM-DD");
                const today = moment().format("YYYY-MM-DD");
                return paymentDate === today;
              }
              return true;
            })
            .map((item, index) => (
              <tr key={item?._id}>
                <td>{index + 1}</td>
                <td>{item?.user_fullname}</td>
                <td>
                  {groupData.find((group) => group._id === item?.user_group)
                    ? groupData.find((group) => group._id === item?.user_group)
                        .name +
                      " " +
                      groupData.find(
                        (group) => group._id === item?.user_group
                      ).number
                    : "Noma'lum"}
                </td>
                <td>{item?.payment_quantity.toLocaleString()} UZS</td>
                <td>
                  {monthName(item?.payment_month.slice(0, 2)) +
                    " " +
                    item.payment_month.slice(3, 8)}
                </td>
                <td>{moment(item?.createdAt).format("DD.MM.YYYY HH:mm")}</td>
                <td>
                  {item?.payment_type === "cash"
                    ? "Naqd"
                    : item?.payment_type === "card"
                    ? "Karta"
                    : item?.payment_type === "bankshot"
                    ? "BankShot"
                    : "Noma'lum"}
                </td>
              </tr>
            ))}
        </tbody>
      </Table>

      <div className="total-payment">
        <h3>Jami to'lov: {getTotalPayment().toLocaleString()} UZS</h3>
      </div>
    </div>
  );
};

// 🟩 Helper function for month names
const monthName = (month) => {
  switch (month) {
    case "01":
      return "Yanvar";
    case "02":
      return "Fevral";
    case "03":
      return "Mart";
    case "04":
      return "Aprel";
    case "05":
      return "May";
    case "06":
      return "Iyun";
    case "07":
      return "Iyul";
    case "08":
      return "Avgust";
    case "09":
      return "Sentabr";
    case "10":
      return "Oktabr";
    case "11":
      return "Noyabr";
    case "12":
      return "Dekabr";
    default:
      return "Noma'lum oy";
  }
};
