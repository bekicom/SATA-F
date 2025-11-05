import React, { useEffect, useState } from "react";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { useGetSchoolQuery } from "../../context/service/admin.service";
import {
  useGetPaymentLogQuery,
  useGetPaymentSummaryMonthQuery,
  useGetPaymentSummaryQuery,
} from "../../context/service/payment.service";
import {
  useGetHarajatSummaryQuery,
  useGetHarajatQuery,
} from "../../context/service/harajat.service";
import moment from "moment";
import { DatePicker } from "antd";
import "./home.css";

ChartJS.register(
  LineElement,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Filler
);

const Home = () => {
  const { data: schoolData = {} } = useGetSchoolQuery();
  const { data: payments = [] } = useGetPaymentLogQuery();
  const { data: summaryData = [] } = useGetPaymentSummaryQuery();
  const { data: harajatSummaryData = [] } = useGetHarajatSummaryQuery();
  const { data: datasumma = [] } = useGetHarajatQuery();

  const [selectedDate, setSelectedDate] = useState(
    moment().format("YYYY-MM-DD")
  );
  const selectedMonth = moment(selectedDate).format("MM-YYYY");
  const { data: summaryMonthData = [] } = useGetPaymentSummaryMonthQuery({
    month: selectedMonth,
  });

  const [summ, setSum] = useState([]);
  const [harajatSumm, setHarajatSum] = useState([]);
  const [dailyExpenseNaqd, setDailyExpenseNaqd] = useState(0);
  const [dailyExpenseCard, setDailyExpenseCard] = useState(0);
  const [dailyExpenseBankshot, setDailyExpenseBankshot] = useState(0);
  const [dailyPaymentCash, setDailyPaymentCash] = useState(0);
  const [dailyPaymentCard, setDailyPaymentCard] = useState(0);
  const [monthlyExpense, setMonthlyExpense] = useState(0);
  const [monthlyPayment, setMonthlyPayment] = useState(0);
  const [currentBudget, setCurrentBudget] = useState(0);
  const [payment_quantity, setpayment_quantity] = useState(0);
  console.log("========", payment_quantity);

  useEffect(() => {
    setSum(summaryData.map((item) => item.summ));
    setHarajatSum(harajatSummaryData.map((item) => item.summ));
  }, [summaryData, harajatSummaryData]);

  useEffect(() => {
    const currentDate = moment(selectedDate, "YYYY-MM-DD").format("YYYY-MM-DD");

    // 🔹 Xarajatlarni ajratamiz
    const dailyNaqd = datasumma
      .filter(
        (item) =>
          moment(item.createdAt).format("YYYY-MM-DD") === currentDate &&
          item.paymentType === "naqd"
      )
      .reduce((t, i) => t + i.summ, 0);

    const dailyCard = datasumma
      .filter(
        (item) =>
          moment(item.createdAt).format("YYYY-MM-DD") === currentDate &&
          item.paymentType === "plastik"
      )
      .reduce((t, i) => t + i.summ, 0);

    const dailyBankshot = datasumma
      .filter(
        (item) =>
          moment(item.createdAt).format("YYYY-MM-DD") === currentDate &&
          item.paymentType === "bankshot"
      )
      .reduce((t, i) => t + i.summ, 0);

    setDailyExpenseNaqd(dailyNaqd);
    setDailyExpenseCard(dailyCard);
    setDailyExpenseBankshot(dailyBankshot);

    // 🔹 Kirimlarni ajratamiz
    const cashPayments = payments
      .filter(
        (p) =>
          moment(p.createdAt).format("YYYY-MM-DD") === currentDate &&
          p.payment_type === "cash"
      )
      .reduce((acc, item) => acc + item.payment_quantity, 0);

    const cardPayments = payments
      .filter(
        (p) =>
          moment(p.createdAt).format("YYYY-MM-DD") === currentDate &&
          p.payment_type === "card"
      )
      .reduce((acc, item) => acc + item.payment_quantity, 0);

    const bankPayments = payments
      .filter(
        (p) =>
          moment(p.createdAt).format("YYYY-MM-DD") === currentDate &&
          p.payment_type === "bankshot"
      )
      .reduce((acc, item) => acc + item.payment_quantity, 0);

    setDailyPaymentCash(cashPayments);
    setDailyPaymentCard(cardPayments);
    setpayment_quantity(bankPayments); // 🟩 endi bu bankshot summasi bo‘ladi

    const currentMonthIndex = moment(selectedMonth, "MM-YYYY").month();
    setMonthlyExpense(harajatSumm[currentMonthIndex] || 0);
    setMonthlyPayment(summ[currentMonthIndex] || 0);

    const initialBudget =
      schoolData.budgetHistory?.find((item) =>
        moment(item.month, "MM-YYYY").isSame(selectedMonth, "month")
      )?.budget || 0;

    setCurrentBudget(
      initialBudget +
        (summ[currentMonthIndex] || 0) -
        (harajatSumm[currentMonthIndex] || 0)
    );
  }, [
    selectedMonth,
    selectedDate,
    summ,
    harajatSumm,
    payments,
    datasumma,
    schoolData.budgetHistory,
  ]);

  const handleDateChange = (date, dateString) => {
    setSelectedDate(dateString || moment().format("YYYY-MM-DD"));
  };

  const months = [
    "Yanvar",
    "Fevral",
    "Mart",
    "Aprel",
    "May",
    "Iyun",
    "Iyul",
    "Avgust",
    "Sentabr",
    "Oktabr",
    "Noyabr",
    "Dekabr",
  ];

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top",
        labels: {
          color: "#1f2937",
          font: { size: 12, weight: "600" },
          padding: 15,
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: 12,
        titleColor: "#fff",
        bodyColor: "#fff",
        borderColor: "rgba(255, 255, 255, 0.2)",
        borderWidth: 1,
        displayColors: true,
        callbacks: {
          label: function (context) {
            return (
              context.dataset.label +
              ": " +
              context.parsed.y.toLocaleString() +
              " UZS"
            );
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: "rgba(0, 0, 0, 0.05)" },
        ticks: { color: "#6b7280", font: { size: 11 } },
      },
      x: {
        grid: { display: false },
        ticks: { color: "#6b7280", font: { size: 11 } },
      },
    },
  };

  const combinedChartData = {
    labels: months,
    datasets: [
      {
        label: "Kirim",
        data: summ,
        backgroundColor: "rgba(16, 185, 129, 0.2)",
        borderColor: "rgba(16, 185, 129, 1)",
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: "rgba(16, 185, 129, 1)",
      },
      {
        label: "Xarajat",
        data: harajatSumm,
        backgroundColor: "rgba(239, 68, 68, 0.2)",
        borderColor: "rgba(239, 68, 68, 1)",
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: "rgba(239, 68, 68, 1)",
      },
    ],
  };

  const barChartData = {
    labels: months,
    datasets: [
      {
        label: "Kirim",
        data: summ,
        backgroundColor: "rgba(16, 185, 129, 0.8)",
        borderRadius: 8,
        borderSkipped: false,
      },
      {
        label: "Xarajat",
        data: harajatSumm,
        backgroundColor: "rgba(239, 68, 68, 0.8)",
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  return (
    <div className="modern-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title"> Dashboard</h1>
          <p className="dashboard-subtitle">
            Moliyaviy ko'rsatkichlar va hisobotlar
          </p>
        </div>
        <DatePicker
          onChange={handleDateChange}
          format="YYYY-MM-DD"
          picker="date"
          placeholder="📅 Sana tanlang"
          className="modern-datepicker"
        />
      </div>

      <div className="stats-grid">
        <div className="stat-card stat-income">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <p className="stat-label">Oylik Kirim</p>
            <h3 className="stat-value">{monthlyPayment?.toLocaleString()}</h3>
            <span className="stat-currency">UZS</span>
          </div>
        </div>

        <div className="stat-card stat-expense">
          <div className="stat-icon">📉</div>
          <div className="stat-info">
            <p className="stat-label">Oylik Xarajat</p>
            <h3 className="stat-value">{monthlyExpense?.toLocaleString()}</h3>
            <span className="stat-currency">UZS</span>
          </div>
        </div>
        <div className="stat-card stat-budget">
          <div className="stat-icon">💼</div>
          <div className="stat-info">
            <p className="stat-label">Sof foyda</p>
            <h3 className="stat-value">{currentBudget?.toLocaleString()}</h3>
            <span className="stat-currency">UZS</span>
          </div>
        </div>
      </div>

      <div className="daily-stats">
        <div className="daily-card daily-income">
          <h4 className="daily-title">📥 Bugungi Kirim</h4>
          <div className="daily-items">
            <div className="daily-item">
              <span className="item-icon">💵</span>
              <div className="item-info">
                <p className="item-label">Naqd</p>
                <p className="item-value">
                  {dailyPaymentCash?.toLocaleString()} UZS
                </p>
              </div>
            </div>
            <div className="daily-item">
              <span className="item-icon">💳</span>
              <div className="item-info">
                <p className="item-label">Karta</p>
                <p className="item-value">
                  {dailyPaymentCard?.toLocaleString()} UZS
                </p>
              </div>
            </div>
            <div className="daily-item">
              <span className="item-icon">🏦</span>
              <div className="item-info">
                <p className="item-label">Hisob raqam</p>
                <p className="item-value">
                  {payment_quantity?.toLocaleString()} UZS
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="daily-card daily-expense">
          <h4 className="daily-title">📤 Bugungi Xarajat</h4>
          <div className="daily-items">
            <div className="daily-item">
              <span className="item-icon">💵</span>
              <div className="item-info">
                <p className="item-label">Naqd</p>
                <p className="item-value">
                  {dailyExpenseNaqd?.toLocaleString()} UZS
                </p>
              </div>
            </div>
            <div className="daily-item">
              <span className="item-icon">💳</span>
              <div className="item-info">
                <p className="item-label">Karta</p>
                <p className="item-value">
                  {dailyExpenseCard?.toLocaleString()} UZS
                </p>
              </div>
            </div>
            <div className="daily-item">
              <span className="item-icon">🏦</span>
              <div className="item-info">
                <p className="item-label">Xisob Raqam</p>
                <p className="item-value">
                  {dailyExpenseBankshot?.toLocaleString()} UZS
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="charts-section">
        <div className="chart-container">
          <h3 className="chart-title">📈 Yillik Moliyaviy Grafik</h3>
          <div className="chart-wrapper">
            <Line data={combinedChartData} options={chartOptions} />
          </div>
        </div>

        <div className="chart-container">
          <h3 className="chart-title">📊 Bar Grafik</h3>
          <div className="chart-wrapper">
            <Bar data={barChartData} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
