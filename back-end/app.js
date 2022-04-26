import express from "express";
import cors from "cors";
import chalk from "chalk";
import { appendFile } from "fs";

const app = express();
app.use(cors())
app.use(express.json());

const participantes =[];//{name: 'João', lastStatus: 12313123} // O conteúdo do lastStatus será explicado nos próximos requisitos
const mensagens = [];//{from: 'João', to: 'Todos', text: 'oi galera', type: 'message', time: '20:04:37'}


app.post("/participants" , (req , res) => {
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





app.listen(5000 , () =>{
console.log(chalk.yellow("i`m aliveeee"))
})