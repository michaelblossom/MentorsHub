"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const group_route_1 = __importDefault(require("./routes/group.route"));
const project_route_1 = __importDefault(require("./routes/project.route"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const morgan_1 = __importDefault(require("morgan"));
const app = (0, express_1.default)();
// Global MIDDLEWARES'
// global middleware
if (process.env.NODE_ENV === "development") {
    app.use((0, morgan_1.default)("dev"));
}
// body parser
app.use(express_1.default.json({ limit: "10kb" }));
app.use((0, cookie_parser_1.default)());
app.use((0, cors_1.default)({
    origin: ["http://localhost:3000"],
    credentials: true,
}));
app.use(express_1.default.static(`${__dirname}/public`)); //for serving static files
app.use("/api/v1/auth", auth_routes_1.default);
app.use("/api/v1/groups", group_route_1.default);
app.use("/api/v1/projects", project_route_1.default);
exports.default = app;
