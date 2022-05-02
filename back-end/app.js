import {MongoClient, ObjectId} from 'mongodb';
import express from 'express';
import cors from 'cors';
import chalk from 'chalk';
import dotenv from 'dotenv';
import dayjs from 'dayjs';
import joi from "joi";


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



app.post('/participants', async (req, res) => {
 
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

});





app.get("/participants", async (req, res) => {
   {
    try {
      let participants = await db.collection("participants").find().toArray();
      res.status(200).send(participants);
      mongoClient.close();
    } catch (error) {
      res.send(404).send("desculpe, mas não conseguimos achar o participante");
      mongoClient.close();
    }
  }

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
  message = stripHtml(message).result.trim();

  try{
    const validarMessage = messageValidar.validate(message);
    if(!validarMessage){
      res.send(422);
    }
  } catch (error) {
    sendStatus(422).send("xabu", error)
  }


  try {
    const participanteArray = mongoClient.db("bate-papo-uol").collection("participants");
    const participants = await participanteArray.findOne({ name: from });

    if (!participants) {
      res.sendStatus(422);
      console.log("O participante n foi encontrado");
      return;
    }

    await db.collection("messages").insertOne(message);
    res.sendStatus(201);
  } catch (e) {
    console.log("Deu xabu", e);
    res.status(422).send(e);
  }
});


app.get("/messages", async (req, res) => {


  try {
    const from = req.headers.user;
    const { limit } = req.query;
    let messages = await db.collection("messages").find().toArray();
    const inicio = (pagina - 1) * limit;
    const final = pagina * limit;

    const messageFiltradas = [...messages , from].reverse().slice(inicio, final);
    if (limit) {
      res.status(200).send(messageFiltradas);
      return;
    }
    if (!limit) {
      res.status(200).send(messages);
      return;
    }
    res.sendStatus(201);
    mongoClient.close();
  } catch (error) {
    res.send(422).send("desculpe, mas não conseguimos achar a mensagem");
    mongoClient.close();
  }
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
    res.send(422).send("desculpe,não conseguimos achar o seu usuário e atualizar" , e);
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
    await database.collection('participants').deleteOne(participanteInativo.name);//n entendi bem essa parte
    messagesArray.insertOne(
      {
        from: participanteInativo.name,
        to: 'Todos',
        text: 'sai da sala...',
        type: 'status',
        time: 'HH:MM:SS'
      }
    )
  }
  return messagesArray;
  }catch(err){
    res.send(422).send(err);
    mongoClient.close();
  }
}, 15000)


app.delete("/message/:idMessage" , async (req , res) =>{
  try{
  const from = req.headers.user;
  const { idMessage }  = req.params;
  const messagesArray = mongoClient.db("bate-papo-uol").collection("messages");
  const messageId = messagesArray.find({_id: new ObjectId(idMessage)})
  if(!messageId){
    sendStatus(404).send("mensagem inválida")
    return;
  }
  if(from !== messagesArray.from){
    sendStatus(401).send("usuário não bate com o usuaŕio da mensagem")
  }
  await messagesArray.deleteOne({ _id: new ObjectId(idMessage) })
  }catch(e){
    res.send(422).send(err);
    mongoClient.close();
  }
})


 app.put("/message/:idMessage" , async (req , res)=>{
  const {body} = req;
  const from = req.header.user;
  const { idMessage }  = req.params;
  const message = {
    from: from,
    to: body.to,
    text: body.text,
    type: body.type,
    time: dayjs().format('HH:mm:ss')
};
try{
const validarMessage = messageValidar.validate(message);
if(!validarMessage){
  res.send(422);
}
}catch(error){
  sendStatus(422).send("xabu" , error)
}

try{
const messagesArray = mongoClient.db("bate-papo-uol").collection("messages");
const VerificarMessage =  messagesArray.find({_id: new ObjectId(idMessage)})
if(!VerificarMessage){
  res.sendStatus(404)
  return;
}
const participanteArray = mongoClient.db("bate-papo-uol").collection("participants");
const participants = await participanteArray.findOne({name: from});
if(!participants){
  res.sendStatus(401)
  return;
}
}catch(error){
sendStatus(422).send("xabu" , error)
}
 })
app.listen(5000, () => {
  console.log(chalk.yellow("i`m aliveeee"))
})
