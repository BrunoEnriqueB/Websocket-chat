const { Server } = require('ws');
const http = require('http');
const fs = require('fs').promises;
const path = require('path');

const port = process.env.PORT || '3000';

const renderErrorPage = async function (req, res) {
  const errorPage = await fs.readFile(path.join(__dirname, '/error.html'));
  res.setHeader('Content-Type', 'text/html');
  res.writeHead(500);
  return res.end(errorPage);
};

const genericErrorResponse = async function (req, res) {
  res.writeHead(500);
  return res.end(
    JSON.stringify({
      success: false,
      message: 'Some error ocurred'
    })
  );
};

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/') {
    try {
      const file = await fs.readFile(path.join(__dirname, '/index.html'));
      res.setHeader('Content-Type', 'text/html');
      res.writeHead(200);
      return res.end(file);
    } catch (error) {
      return renderErrorPage(req, res);
    }
  }

  if (req.method === 'GET' && req.url === '/chat') {
    try {
      const file = await fs.readFile(path.join(__dirname, '/chat.html'));
      res.setHeader('Content-Type', 'text/html');
      res.writeHead(200);
      return res.end(file);
    } catch (error) {
      return renderErrorPage(req, res);
    }
  }

  if (req.method === 'POST' && req.url === '/') {
    res.setHeader('Content-Type', 'application/json');
    try {
      res.writeHead(200);
      return res.end(
        JSON.stringify({
          success: true,
          message: 'Hello World'
        })
      );
    } catch (error) {
      return genericErrorResponse();
    }
  }

  if (req.method === 'GET') {
    try {
      const file = await fs.readFile(path.join(__dirname, '/not-found.html'));
      res.setHeader('Content-Type', 'text/html');
      res.writeHead(404);
      return res.end(file);
    } catch (error) {
      return renderErrorPage();
    }
  }
});

const ws = new Server({
  server
});

const allMessages = [];

ws.on('connection', function connection(ws) {
  ws.on('error', console.error);

  ws.on('message', (data) => eventHandler(ws, JSON.parse(data)));

  ws.on('close', (data) => console.log('Client disconnected'));

  emitEvent('load-all-messages', allMessages, ws);
});

const events = {
  'new-message': sendMessageForAllCLients
};

function eventHandler(ws, event) {
  return events[event.eventName](event, ws);
}

function emitEvent(eventName, data, client) {
  client.send(
    JSON.stringify({
      eventName,
      data
    })
  );
}

function sendMessageForAllCLients(event) {
  const { data, userId } = event;

  const newMessage = {
    userId: userId,
    message: data.newMessage,
    username: data.username,
    timestamp: new Date()
  };

  allMessages.push(newMessage);

  ws.clients.forEach((client) => {
    emitEvent('new-message', newMessage, client);
  });
}

server.listen(port, null, () => {
  console.log(`server is running on port: ${port}`);
});
