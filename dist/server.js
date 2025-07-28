"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const app_1 = __importDefault(require("./app"));
dotenv_1.default.config({ path: "./config.env" });
const DB = process.env.DATABASE.replace("<password>", process.env.DATABASE_PASSWORD);
mongoose_1.default
    .connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then((con) => {
    console.log("Db connection successful");
});
const port = 3000;
const server = app_1.default.listen(port, () => {
    console.log(`App running in port ${port}...`);
});
