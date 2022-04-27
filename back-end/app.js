import express from "express";
import cors from "cors";
import chalk from "chalk";
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import dayjs from 'dayjs';
import { appendFile } from "fs";
import joi from "joi";

dotenv.config();

const app = express();
app.use(cors())
app.use(express.json());


const participantes=[];
const messages = [];

let db;
const mongoClient = new MongoClient("mongodb://localhost:27017");

const participanteValidar= joi.object({
  name: joi.string().required()
})

const messageValidar = joi.object({
  to: joi.string().required(),
  text: joi.string().required(),
  type: joi.string().valid('message', 'private_message'),
})

app.post("/participants", (req, res) => {
  /*  FIXME("VALIDAÇÃO COM A BLIBIOTECA JOI") */
  const participante = req.body.name

  const participanteArray = mongoClient.db("bate-papo-uol").collection("participants");
  const nomeParticipanteTrue = participanteArray.findOne({ name: participante.name });

  const validar = participanteValidar.validate(participante);
  if (validar.error) {
    return res.sendStatus(422)
  }

  if (nomeParticipanteTrue) {
    return res.sendStatus(409);
  }
   participanteArray.insertOne({ ...participante, lastStatus: Date.now() });
   participantes.push(participanteArray)
})



app.get("/participants", (req, res) => {
  /* await */ mongoClient.connect()
  res.send(participantes)
})


app.post("/messages", (req, res) => {
  const { to, text, type } = req.body;
  const from = req.headers.user;

  const ValidarTo = messageValidar.validate(to) 
  const ValidarText = messageValidar.validate(text) 
  const ValidarType = messageValidar.validate(type)

  const messagesArray = mongoClient.db("bate-papo-uol").collection("messages");

  if (!ValidarTo) {
    res.status(422).send("Todos os campos são obrigatórios!");
    return;
  }
  if (!ValidarType || !ValidarText) {
    res.status(422).send("Todos os campos são obrigatórios!");
    return;
  }
  const nomeParticipanteTrue =  participantes.findOne({ name: from })
  if (!nomeParticipanteTrue) {
    return res.sendStatus(422);
  }
  messagesArray.insertOne({
    from: participantes.name,
    to: to,
    text: text,
    type: type,
    time:dayjs().format("HH:MM:SS")
})
messages.push(messagesArray)
res.sendStatus(201);
})






app.listen(5000, () => {
  console.log(chalk.yellow("i`m aliveeee"))
})