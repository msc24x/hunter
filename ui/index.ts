import express from 'express';

const app = express()

app.use(express.static("."))


app.listen(80, ()=>{
    console.log("started")
})