import express from "express";
import cors from "cors";
import chalk from "chalk";
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import dayjs from 'dayjs';
import { appendFile } from "fs";
import joi from "joi";
import { stripHtml } from "string-strip-html";
import { strict as assert } from "assert";
import { defaultMaxListeners } from "events";

dotenv.config();

const app = express();
app.use(cors())
app.use(express.json());




let db = null;
const mongoClient = new MongoClient(process.env.MONGO_URL);
const promise = mongoClient.connect();

promise.then(() =>{
  db = mongoClient.db("api_bate_papo_uol");
  console.log("conectou ao banco do bate-papo-uol");
})
promise.catch(res => console.log(chalk.red("deu xabu"), res))


const participanteValidar= joi.object({
  name: joi.string().required()
})

const messageValidar = joi.object({
  to: joi.string().required(),
  text: joi.string().required(),
  type: joi.string().valid('message', 'private_message'),
})


//era pra colocar as mensagens e os posts por isso o post de participants era tão grande ;-;
app.post('/participants', async (req, res) => {
  async function EnviarParticipante()
  const participant = req.body;

  participant.name = stripHtml(participant.name).result.trim();
  
  const validation = participanteValidar.validate(participant);
  if (validation.error) {
    return res.sendStatus(422)
  }

  try {
    const mongoClient = new MongoClient(process.env.MONGO_URL);
    await mongoClient.connect()

    const participanteArray = mongoClient.db("bate-papo-uol").collection("participants");
    const messagesArray = mongoClient.db("bate-papo-uol").collection("messages");
      
    const participanteExiste = await participanteArray.findOne({ name: participant.name });
    if (participanteExiste) {
      return res.sendStatus(409);
    }

    await participanteArray.insertOne({ ...participant, lastStatus: Date.now() });

    await messagesArray.insertOne({
      from: participant.name,
      to: 'Todos',
      text: 'entra na sala...',
      type: 'status',
      time: dayjs().format("HH:mm:ss")
    });
    res.sendStatus(201);
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
  EnviarParticipante()
});





app.get("/participants", (req, res) => {
  async function participanteAchar() {
    try {
      let participants = await db.collection("participants").find().toArray();
      res.status(200).send(participants);
    } catch (error) {
      res.send(404).send("desculpe, mas não conseguimos achar o participante" );
    }
  }
  participanteAchar();
});



app.post("/messages", (req, res) => {
  async function EnviarMessage() 
  const { to, text, type } = req.body;
  const from = req.headers.user;

  const ValidarTo = messageValidar.validate(to) 
  const ValidarText = messageValidar.validate(text) 
  const ValidarType = messageValidar.validate(type)
  to = stripHtml(to).result.trim();
  type = stripHtml(type).result.trim();
  text = stripHtml(text).result.trim();
  from = stripHtml(from).result.trim();
  

  const participanteArray = mongoClient.db("bate-papo-uol").collection("participants");
  const messagesArray = mongoClient.db("bate-papo-uol").collection("messages");

  if (!ValidarTo) {
    res.status(422).send("Todos os campos são obrigatórios!");
    return;
  }
  if (!ValidarType || !ValidarText) {
    res.status(422).send("Todos os campos são obrigatórios!");
    return;
  }
  const nomeParticipanteTrue =  participanteArray.findOne({ name: from })
  if (!nomeParticipanteTrue) {
    return res.sendStatus(422);
  }

  await db.messagesArray.insertOne({
    from: participanteArray.name,
    to: [...to],
    text: [...text],
    type: [...type],
    time:dayjs().format("HH:MM:SS")
  });
  res.sendStatus(201);
  EnviarMessage()
});



app.listen(5000, () => {
  console.log(chalk.yellow("i`m aliveeee"))
})


