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
import { sendStatus } from "express/lib/response";

dotenv.config();

const app = express();
app.use(cors())
app.use(express.json());




let db = null;
const mongoClient = new MongoClient(process.env.MONGO_URL);
const promise = mongoClient.connect();

promise.then(() => {
  db = mongoClient.db("api_bate_papo_uol");
  console.log("conectou ao banco do bate-papo-uol");
})
promise.catch(res => console.log(chalk.red("deu xabu"), res))


const participanteValidar = joi.object({
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

    const participanteArray = mongoClient.db("bate-papo-uol").collection("participants");
    const messagesArray =  mongoClient.db("bate-papo-uol").collection("messages");

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
    mongoClient.close();
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
    mongoClient.close();
  }
  EnviarParticipante()
});





app.get("/participants", (req, res) => {
  async function participanteAchar() {
    try {
      let participants = await db.collection("participants").find().toArray();
      res.status(200).send(participants);
      mongoClient.close();
    } catch (error) {
      res.send(404).send("desculpe, mas não conseguimos achar o participante");
      mongoClient.close();
    }
  }
  participanteAchar();
});



app.post('/messages', async (req, res) => {
  const {body} = req;
  const from = req.header.user;
  
  const message = {
      from: from,
      to: body.to,
      text: body.text,
      type: body.type,
      time: dayjs().format('HH:mm:ss')
  };

  try {
      await messageValidar.validateAsync(message, { abortEarly: false});
  } catch(e) {
      res.status(422).send("formato errado");
      return;
  }

  try {
      const participants = await database.collection("participants").findOne({name: from});

      if (!participants) {
          res.sendStatus(422);
          console.log("O participante deve já estar cadastrado");
          return;
      }

      await db.collection("messages").insertOne(message);
      res.sendStatus(201);
  } catch(e) {
      console.log("Deu xabu", e);
      res.status(422).send(e);
  }
});


app.get("/messages", async (req, res) => {

  async function PegarMessages() {
    try {
     const from = req.headers.user;
      const { limit } = req.query;
      let messages = await db.collection("messages").find().toArray();
      if (limit) {
        //dividir o limit pra ter so as mensagens daqui
        res.status(200).send(messages);
        return;
      }
      if(!limit){
        res.status(200).send(messages);
        return;
      }
      res.sendStatus(201);
      mongoClient.close();
    } catch (error) {
      res.send(404).send("desculpe, mas não conseguimos achar a mensagem");
      mongoClient.close();
    }
  }
  PegarMessages();
});


app.post("/status" , async (req , res) =>{
  try{
  const from = req.headers.user;
  const participanteArray = mongoClient.db("bate-papo-uol").collection("participants");
  let participanteExiste = await participanteArray.findOne({ name: from });
  if(!participanteExiste){
    sendStatus(404).send("não encontramos seu user");
    return;
    }
    await db.collection("participants").updateOne({ name: from },
      { $set: { lastStatus: Date.now() } });
  res.sendStatus(200);
  }catch(e){
    res.send(404).send("desculpe,não conseguimos achar o seu usuário e atualizar" , e);
    mongoClient.close();
  }

})

setInterval(async () => {
  try{
  const participanteArray = mongoClient.db("bate-papo-uol").collection("participants")
  const messagesArray = mongoClient.db("bate-papo-uol").collection("messages");
  let acharInativo = await participanteArray.find().toArray();
   const Inatividade = acharInativo.filter(participanteInativo => participanteInativo.lastStatus)
  if(Inatividade > 10000){
    messagesArray.insertOne(
      {
        from: 'xxx',
        to: 'Todos',
        text: 'sai da sala...',
        type: 'status',
        time: 'HH:MM:SS'
      }
    )
  }
  return messagesArray;
  }catch(err){
    res.send(404).send(err);
    mongoClient.close();
  }
}, 15000)



app.listen(5000, () => {
  console.log(chalk.yellow("i`m aliveeee"))
})
