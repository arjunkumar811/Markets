import express from "express";
import cors from "cors";
import { middleware } from "./middleware";
import { prisma } from "db"; 

const app = express();

app.use(express.json());

app.use(cors());


app.post("/buy", middleware, (req, res) => {
  prisma.market.findFirst();
  res.json({
    message: "Hi",
  });
});

app.post("/sell", middleware, (req, res) => {
  res.json({ message: "Sell route" });
});

app.post("/split", middleware, (req, res) => {
  res.json({ message: "Split route" });
});

app.post("/merge", middleware, (req, res) => {
  res.json({ message: "Merge route" });
});

app.get("/balance", middleware, (req, res) => {
  res.json({ message: "Balance route" });
});

app.get("/position", middleware, (req, res) => {
  res.json({ message: "Position route" });
});

app.get("/history", middleware, (req, res) => {
  res.json({ message: "History route" });
});


app.listen(3000);
