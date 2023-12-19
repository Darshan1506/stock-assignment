import React, { useState, useEffect } from "react";
import "./App.css";
import { w3cwebsocket as WebSocket } from "websocket";
import axios from "axios";

const App = () => {
  const [stocks, setStocks] = useState([]);
  const [selectedStocks, setSelectedStocks] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [inputError, setInputError] = useState("");
  const [loading, setLoading] = useState(false);
  const socket = new WebSocket("wss://seemly-nervous-rutabaga.glitch.me");

  useEffect(() => {
    socket.onmessage = (event) => {
      const updatedStocks = JSON.parse(event.data);
      setStocks(updatedStocks);
    };

    return () => {
      socket.close();
    };
  }, [socket]);

  useEffect(() => {
    if (selectedDate) {
      getDataApi(selectedDate);
    }
  }, [selectedDate]);

  const handleSelectStocks = (count) => {
    if (count > 20) {
      setInputError("Maximum stocks allowed is 20");
      return;
    }
    setInputError("");
    const selectedStocks = stocks.slice(0, count);
    setSelectedStocks(selectedStocks);
    const payload = {
      date: selectedDate,
    };
    socket.send(JSON.stringify(payload));
  };

  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
  };

  const getDataApi = (newDate) => {
    setLoading(true);
    axios
    .get(`https://seemly-nervous-rutabaga.glitch.me/api/stocks/${newDate}`)
    .then((response) => {
        setStocks(response.data);
        setSelectedStocks(response.data);
      })
      .catch((error) => {
        console.error("Error fetching stock data:", error.message);
        setInputError("Error fetching stock data");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className="mx-10 bg-[#fefefe] mt-10">
      <div className="flex items-center justify-between">
        <div className="border border-lg p-2 rounded-lg bg-white">
          <input
            className="text-[1rem]"
            type="date"
            id="selectedDate"
            name="selectedDate"
            onChange={(e) => handleDateChange(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="stockCount">
            Number of stocks:
          </label>
          <input
            type="number"
            id="stockCount"
            name="stockCount"
            className="border border-lg rounded-lg p-2 ml-2"
            min="1"
            max="20"
            onChange={(e) =>
              handleSelectStocks(parseInt(e.target.value, 10))
            }
          />
          {inputError && (
            <p className="text-red-500 text-xs">{inputError}</p>
          )}
        </div>
      </div>
      
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div class="relative overflow-x-auto mt-10">
          <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
            <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" class="w-[50%] text-center py-3">
                  Stock Symbol
                </th>
                <th scope="col" class="w-[50%] text-center py-3">
                  Opening Price
                </th>
              </tr>
            </thead>
            <tbody>
              {selectedStocks.map((stock) => (
                <tr
                  class="bg-white border-b dark:bg-gray-800 dark:border-gray-700"
                  key={stock.o}
                >
                  <td class="w-[50%] text-center py-3">{stock.T}</td>
                  <td class="w-[50%] text-center py-3">{stock.o}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default App;
