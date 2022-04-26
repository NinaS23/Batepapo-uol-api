import express from "express";
import cors from "cors";
import chalk from "chalk";
import { appendFile } from "fs";
import joi from "joi";
dotenv.config();

const app = express();
app.use(cors())
app.use(express.json());

const participantes =[];//{name: 'João', lastStatus: 12313123} // O conteúdo do lastStatus será explicado nos próximos requisitos
const mensagens = [];//{from: 'João', to: 'Todos', text: 'oi galera', type: 'message', time: '20:04:37'}

const participante = joi.object({
    name: joi.string().required()
  })

const message= joi.object({
    to: joi.string().required(),
    text: joi.string().required(),
    type: joi.string().valid('message', 'private_message'),
  })

app.post("/participants" , (req , res) => {
   /*  FIXME("VALIDAÇÃO COM A BLIBIOTECA JOI") */
 const { name } = req.body
if(name == ""){
    res.status(422).send("Todos os campos são obrigatórios!"); 
    return;
}
if(name === name){
    es.status(409).send("Este nome já existe");
    return;
}
participantes.push(name)
})

app.get("/psticipants" , (req , res) => {
    res.send(participantes)
})


app.post("/messages" , (req , res) => {
 const { to , text , type} = req.body;


 if(to == "" || type == ""){
    res.status(422).send("Todos os campos são obrigatórios!"); 
    return; 
 } 
 if(type !==  "message" ||  type !== "private_message"){
    res.status(422).send("Todos os campos são obrigatórios!"); 
    return;   
 }


})




app.listen(5000 , () =>{
console.log(chalk.yellow("i`m aliveeee"))
})