//Importamos dontenv para poder leer las variables de el archivo .env
import "dotenv/config";

// Importamos la librería de telegram
import TelegramBot from "node-telegram-bot-api";

//Importamos la libreria de ewelink
import ewelink from "ewelink-api";
// Creamos una constante que guarda el Token de nuestro Bot de Telegram que previamente hemos creado desde el bot @BotFather
const token = process.env.TELEGRAM_BOT_API_KEY;

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });

//Cramos la conexion con el ewelink
const connection = new ewelink({
  email: process.env.EWELINK_EMAIL,
  password: process.env.EWELINK_PASSWORD,
  region: "us",
  APP_ID: process.env.EWELINK_APP_ID,
  APP_SECRET: process.env.EWELINK_APP_SECRET,
});

// Después de este comentario es donde ponemos la lógica de nuestro bot donde podemos crear los comandos y eventos para darle funcionalidades a nuestro bot
const chatId = process.env.TELEGRAM_GROUP_CHAT_ID;

bot.onText(/\/status/, async (msg) => {

  
  
  //const chatId = msg.chat.id; //!Use this is dont have a group in telegram //!Use este si no tiene un grupo de telegram
  try {
    const devices = await connection.getDevices();
    //console.log(devices);
    let response = "Estado de tus dispositivos:\n\n";

    devices.forEach((device) => {
      const status = device.online === true ? "Encendido" : "Apagado";
      //console.log(device.params)
      response += `${device.name}: ${status}\n`;
    });

    bot.sendMessage(chatId, response);
  } catch (error) {
    console.log(error);
    bot.sendMessage(
      chatId,
      "Hubo un error al obtener el estado de los dispositivos."
    );
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
      console.log(`Dispositivo: ${device.name} Estado Actual: ${currentState} Estado Anterior: ${previousState}`)
      if (currentState !== previousState) {
        // Cambio detectado, envía un mensaje de Telegram
        console.log(`¡Atención! El dispositivo ${device.name} cambió su estado a ${currentState} Estado Anterior: ${previousState}.`)
        const message = `¡Atención! El dispositivo ${device.name} cambió su estado a ${currentState}.`;
        bot.sendMessage(chatId, message);
      }

      // Actualiza el estado anterior
      previousDeviceStates[deviceId] = currentState;
    });
  } catch (error) {
    console.log(error);
  }
}

setInterval(checkDeviceStateChanges, 5000)// Llama a la función cada 5 minutos (ajusta según tus necesidades)

//setInterval(checkDeviceStateChanges, 1 * 60 * 1000);
