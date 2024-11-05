import "dotenv/config";
import ewelink from "ewelink-api";
import express from "express"; 
import { Server } from "socket.io";

const app = express();
const port = 3000;

// Crear la conexión con ewelink
const connection = new ewelink({
  email: process.env.EWELINK_EMAIL,
  password: process.env.EWELINK_PASSWORD,
  region: "us",
  APP_ID: process.env.EWELINK_APP_ID,
  APP_SECRET: process.env.EWELINK_APP_SECRET,
});

// Configurar servidor HTTP y WebSocket
const server = app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.get('/', async (req, res) => {
  try {
    const devices = await connection.getDevices();
    let response = {};

    devices.forEach((device) => {
      const status = device.online === true ? "Encendido" : "Apagado";
      response[device.name] = status;
    });

    res.json(response);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Hubo un error" });
  }
});

let previousDeviceStates = {};

// Función para verificar cambios en el estado
async function checkDeviceStateChanges() {
  try {
    const devices = await connection.getDevices();
    devices.forEach((device) => {
      const deviceId = device.deviceid;
      const currentState = device.online === true ? "Encendido" : "Apagado";
      const previousState = previousDeviceStates[deviceId] || "Desconocido";

      if (currentState !== previousState) {
        // Cambio detectado, envía una señal a través de socket
        console.log(`¡Atención! El dispositivo ${device.name} cambió su estado a ${currentState} Estado Anterior: ${previousState}.`);
        io.emit('statusChange', { device: device.name, status: currentState, previousStatus: previousState });
      }

      // Actualiza el estado anterior
      previousDeviceStates[deviceId] = currentState;
    });
  } catch (error) {
    console.log(error);
  }
}

// Llama a la función cada 5 segundos
setInterval(checkDeviceStateChanges, 5000);
