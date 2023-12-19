const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const axios = require('axios');
const fs = require('fs');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const stocksDataFile = 'stocksData.json';

const getRandomInterval = () => Math.floor(Math.random() * (5 - 1 + 1) + 1);

const fetchStocksData = async (date) => {
  try {
    const response = await axios.get(`https://api.polygon.io/v2/aggs/grouped/locale/us/market/stocks/${date}`, {
      params: {
        adjusted: true,
        apiKey: 'pI4Lt0HSBhNTjcFvJlu5UDAUeHEVtgrA',
      },
    });

    const limitedStocks = response.data.results && response.data.results.slice(0, 20);

    return limitedStocks || [];
  } catch (error) {
    console.error('Error fetching stocks data:', error.message);
    throw error;
  }
};


const updateAndSendStocksData = async (date) => {
  try {
    const stocksData = await fetchStocksData(date);
    const updatedStocks = stocksData.map((stock) => ({
      ...stock,
      refreshInterval: getRandomInterval(),
    }));

    fs.writeFileSync(stocksDataFile, JSON.stringify(updatedStocks));

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(updatedStocks));
      }
    });
  } catch (error) {
    console.error('Error updating and sending stocks data:', error.message);
  }
};

const startWebSocketServer = () => {
  let updatedDate;
  wss.on('connection', (ws) => {
    console.log('Client connected');

    ws.on('message', (message) => {
      try {
        const { date } = JSON.parse(message);
        updatedDate = date;
      } catch (error) {
        console.error('Error parsing message:', error.message);
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected');
    });
  });
  setInterval(() => {
    updateAndSendStocksData(updatedDate);
  }, 30000);
};

app.use(cors());

app.get('/api/stocks/:date', async (req, res) => {
  const date = req.params.date;
  const stocksData = await fetchStocksData(date);
  res.json(stocksData);
});

const startServer = () => {
  startWebSocketServer();

  server.listen(3001, () => {
    console.log('Server is listening on port 3001');
  });
};

startServer();
