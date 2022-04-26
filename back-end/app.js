import express from "express";
import cors from "cors";
import chalk from "chalk";
import { appendFile } from "fs";

const app = express();
app.use(cors())
app.use(express.json());







app.listen(5000 , () =>{
console.log(chalk.yellow("i`m aliveeee"))
})