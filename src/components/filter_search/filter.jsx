import React from "react";
import { FaSearch } from "react-icons/fa";
import { IoIosSearch } from "react-icons/io";
import "./filter.css";
const Filter = () => {
  return (
    <form className="filter_container">
      <div className="filter_head">
        <p>
          <FaSearch />
        </p>
        <span>Izlash</span>
      </div>
      <div className="filter_body">
        <label htmlFor="sinf">
          <p>Sinf</p>
          <select id="sinf">
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
            <option value="6">6</option>
            <option value="7">7</option>
            <option value="8">8</option>
            <option value="9">9</option>
            <option value="10">10</option>
            <option value="11">11</option>
          </select>
        </label>
        <label htmlFor="harf">
          <p>Sinf</p>
          <select id="harf">
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="D">D</option>
            <option value="E">E</option>
            <option value="F">F</option>
            <option value="G">G</option>
          </select>
        </label>
        <label htmlFor="name">
          <p>Ism, familiya</p>
          <input autoComplete="off" type="text" id="name" />
        </label>
      </div>
      <div className="filter_footer">
        <button>
          <IoIosSearch />
          Izlash
        </button>
      </div>
    </form>
  );
};

export default Filter;
